const {
  EXPECTED_CHANNEL_ID,
  activeSession,
  clearSession,
  googleJson,
  json,
  normalizeTitle,
  ownedChannel,
  parseDuration,
  yesterday
} = require("./youtube-studio-lib");

function chunks(values, size = 50) {
  const output = [];
  for (let index = 0; index < values.length; index += size) output.push(values.slice(index, index + size));
  return output;
}

async function uploadIds(channel, accessToken) {
  const playlistId = channel.contentDetails?.relatedPlaylists?.uploads;
  if (!playlistId) return [];
  const ids = [];
  let pageToken = "";
  for (let page = 0; page < 20; page += 1) {
    const url = new URL("https://www.googleapis.com/youtube/v3/playlistItems");
    url.search = new URLSearchParams({
      part: "contentDetails,snippet,status",
      playlistId,
      maxResults: "50",
      ...(pageToken ? { pageToken } : {})
    });
    const data = await googleJson(url, accessToken);
    ids.push(...(data.items || []).map(item => item.contentDetails?.videoId).filter(Boolean));
    pageToken = data.nextPageToken || "";
    if (!pageToken) break;
  }
  return [...new Set(ids)];
}

async function videoDetails(ids, accessToken) {
  const videos = [];
  for (const group of chunks(ids, 50)) {
    const url = new URL("https://www.googleapis.com/youtube/v3/videos");
    url.search = new URLSearchParams({
      part: "id,snippet,statistics,contentDetails,status",
      id: group.join(",")
    });
    const data = await googleJson(url, accessToken);
    videos.push(...(data.items || []));
  }
  return videos;
}

function reportRows(data = {}) {
  const headers = (data.columnHeaders || []).map(header => header.name);
  return (data.rows || []).map(row => Object.fromEntries(headers.map((name, index) => [name, row[index]])));
}

async function analyticsByVideo(accessToken, endDate) {
  const base = {
    ids: "channel==MINE",
    startDate: "2022-01-01",
    endDate,
    dimensions: "video",
    sort: "-views",
    maxResults: "500"
  };
  const metricSets = [
    "views,estimatedMinutesWatched,averageViewDuration,averageViewPercentage,likes,comments,shares,subscribersGained",
    "views,estimatedMinutesWatched,averageViewDuration,averageViewPercentage,likes,comments"
  ];

  let lastError = null;
  for (const metrics of metricSets) {
    try {
      const url = new URL("https://youtubeanalytics.googleapis.com/v2/reports");
      url.search = new URLSearchParams({ ...base, metrics });
      const data = await googleJson(url, accessToken);
      return {
        rows: reportRows(data),
        metrics: metrics.split(","),
        error: null
      };
    } catch (error) {
      lastError = error;
    }
  }
  return {
    rows: [],
    metrics: [],
    error: lastError?.message || "Analytics are not available yet."
  };
}

function thumbnailOf(video) {
  const thumbnails = video.snippet?.thumbnails || {};
  return thumbnails.maxres?.url || thumbnails.standard?.url || thumbnails.high?.url || thumbnails.medium?.url || thumbnails.default?.url || "";
}

function daysSince(value) {
  if (!value) return null;
  const timestamp = Date.parse(value);
  if (!Number.isFinite(timestamp)) return null;
  return Math.max(0, Math.floor((Date.now() - timestamp) / 86_400_000));
}

function assessment(video, analytics, duplicateCount) {
  const privacyStatus = video.status?.privacyStatus || "unknown";
  const ageDays = daysSince(video.snippet?.publishedAt);
  const notes = [];
  let priority = "standard";

  if (duplicateCount > 1) {
    notes.push(`Potential duplicate group: ${duplicateCount} uploads share a normalized title.`);
    priority = "review";
  }
  if (privacyStatus === "private") {
    notes.push("Private upload: owner review only. It will never be published or deleted automatically.");
  } else if (privacyStatus === "unlisted") {
    notes.push("Unlisted upload: preserve its current visibility unless the owner separately approves a change.");
  }
  if ((video.snippet?.description || "").trim().length < 120) {
    notes.push("Description is brief and may benefit from an editorial review.");
  }
  if (!video.snippet?.thumbnails?.maxres?.url) {
    notes.push("No maximum-resolution thumbnail is reported by YouTube.");
  }
  if (privacyStatus === "public" && ageDays !== null && ageDays <= 30 && Number(video.statistics?.viewCount || 0) < 100) {
    notes.push("Recent public episode with limited early reach; prioritize packaging and distribution review.");
    priority = "high";
  }
  if (privacyStatus === "public" && Number(analytics.averageViewPercentage || 0) > 0 && Number(analytics.averageViewPercentage) < 10) {
    notes.push("Average viewed percentage is below 10%; review the opening and audience fit before changing the episode master.");
    priority = "high";
  }
  if (!notes.length) notes.push("No urgent issue detected from the read-only inventory.");
  return { priority, notes };
}

function normalizeVideo(video, analytics, duplicateCount) {
  const assessmentResult = assessment(video, analytics, duplicateCount);
  return {
    videoId: video.id,
    title: video.snippet?.title || "Untitled video",
    description: video.snippet?.description || "",
    publishedAt: video.snippet?.publishedAt || "",
    thumbnail: thumbnailOf(video),
    privacyStatus: video.status?.privacyStatus || "unknown",
    uploadStatus: video.status?.uploadStatus || "unknown",
    embeddable: Boolean(video.status?.embeddable),
    madeForKids: Boolean(video.status?.madeForKids || video.status?.selfDeclaredMadeForKids),
    durationSeconds: parseDuration(video.contentDetails?.duration || ""),
    tags: Array.isArray(video.snippet?.tags) ? video.snippet.tags : [],
    categoryId: video.snippet?.categoryId || "",
    liveBroadcastContent: video.snippet?.liveBroadcastContent || "none",
    dataApi: {
      views: Number(video.statistics?.viewCount || 0),
      likes: Number(video.statistics?.likeCount || 0),
      comments: Number(video.statistics?.commentCount || 0)
    },
    analytics: {
      views: Number(analytics.views || 0),
      estimatedMinutesWatched: Number(analytics.estimatedMinutesWatched || 0),
      averageViewDuration: Number(analytics.averageViewDuration || 0),
      averageViewPercentage: Number(analytics.averageViewPercentage || 0),
      likes: Number(analytics.likes || 0),
      comments: Number(analytics.comments || 0),
      shares: Number(analytics.shares || 0),
      subscribersGained: Number(analytics.subscribersGained || 0)
    },
    duplicateCount,
    priority: assessmentResult.priority,
    notes: assessmentResult.notes,
    watchUrl: `https://www.youtube.com/watch?v=${encodeURIComponent(video.id)}`,
    studioUrl: `https://studio.youtube.com/video/${encodeURIComponent(video.id)}/edit`,
    thumbnailDecision: {
      required: true,
      currentStatus: "unreviewed",
      proposedVariants: 0,
      canApply: false
    }
  };
}

module.exports = async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return json(res, 405, { error: "Method not allowed" });
  }

  try {
    const session = await activeSession(req, res);
    if (!session) return json(res, 401, { error: "Connect The Alana Show channel first." });

    const channel = await ownedChannel(session.accessToken);
    if (!channel || channel.id !== EXPECTED_CHANNEL_ID) {
      clearSession(res);
      return json(res, 403, { error: "The connected account does not control The Alana Show channel." });
    }

    const ids = await uploadIds(channel, session.accessToken);
    const rawVideos = await videoDetails(ids, session.accessToken);
    const analyticsThrough = yesterday();
    const analyticsResult = await analyticsByVideo(session.accessToken, analyticsThrough);
    const analyticsMap = new Map(analyticsResult.rows.map(row => [row.video, row]));

    const duplicateCounts = new Map();
    for (const video of rawVideos) {
      const key = normalizeTitle(video.snippet?.title);
      if (!key) continue;
      duplicateCounts.set(key, (duplicateCounts.get(key) || 0) + 1);
    }

    const videos = rawVideos
      .map(video => {
        const key = normalizeTitle(video.snippet?.title);
        return normalizeVideo(video, analyticsMap.get(video.id) || {}, duplicateCounts.get(key) || 1);
      })
      .sort((a, b) => new Date(b.publishedAt || 0) - new Date(a.publishedAt || 0));

    const summary = {
      total: videos.length,
      public: videos.filter(video => video.privacyStatus === "public").length,
      private: videos.filter(video => video.privacyStatus === "private").length,
      unlisted: videos.filter(video => video.privacyStatus === "unlisted").length,
      highPriority: videos.filter(video => video.priority === "high").length,
      potentialDuplicates: videos.filter(video => video.duplicateCount > 1).length
    };

    return json(res, 200, {
      mode: "read-only",
      canWrite: false,
      photoApprovalRequired: true,
      channel: {
        id: channel.id,
        title: channel.snippet?.title || "The Alana Show",
        customUrl: channel.snippet?.customUrl || "@alanakvandeveer",
        thumbnail: channel.snippet?.thumbnails?.high?.url || channel.snippet?.thumbnails?.default?.url || ""
      },
      analyticsThrough,
      analyticsMetrics: analyticsResult.metrics,
      analyticsNotice: analyticsResult.error,
      summary,
      limitations: [
        "YouTube Studio drafts that have not become video resources may not appear in the Data API inventory.",
        "Thumbnail impressions and impressions click-through rate are not exposed by the standard YouTube Analytics query used here; Studio remains the source for those fields.",
        "No title, description, visibility, caption, playlist, thumbnail, or video can be changed in this read-only phase."
      ],
      videos
    });
  } catch (error) {
    console.error("YouTube Studio audit failed", {
      name: error?.name || "Error",
      message: error?.message || "Unknown failure"
    });
    if (error?.status === 401) clearSession(res);
    return json(res, error?.status === 401 ? 401 : 502, {
      error: error?.status === 401 ? "Reconnect The Alana Show channel." : "The read-only channel audit could not be completed just now."
    });
  }
};
