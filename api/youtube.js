const HANDLE = "@alanakvandeveer";
const { categorizeEpisode } = require("./episode-categories");
const { identifyEpisodeGuests } = require("./guest-identities");

// 20 uploads-playlist pages cover as many as 1,000 public uploads while
// keeping serverless execution bounded. Pagination still stops immediately
// when YouTube supplies no nextPageToken.
const MAX_PAGES = 20;

// Keep genuine videos while excluding actual Shorts.
// The previous 15-minute rule excluded every video on the channel.
const MIN_STANDARD_VIDEO_SECONDS = 90;
const EXCLUDED_TITLE_PATTERNS = [
  /\bshorts?\b/i,
  /\btrailer\b/i,
  /\bteaser\b/i,
  /\bpromo\b/i
];

function parseDuration(value = "PT0S") {
  const match = value.match(
    /P(?:(\d+)D)?T?(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/
  );
  if (!match) return 0;

  const days = Number(match[1] || 0);
  const hours = Number(match[2] || 0);
  const minutes = Number(match[3] || 0);
  const seconds = Number(match[4] || 0);

  return days * 86400 + hours * 3600 + minutes * 60 + seconds;
}

function normalizeDescription(description = "") {
  return description.replace(/\s+/g, " ").trim();
}

async function getJson(url) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);

  try {
    const response = await fetch(url, { signal: controller.signal });
    if (!response.ok) throw new Error(`YouTube API error ${response.status}`);
    return response.json();
  } finally {
    clearTimeout(timeout);
  }
}

function normalizeVideo(video) {
  const tags = Array.isArray(video.snippet?.tags) ? video.snippet.tags : [];
  const normalized = {
    videoId: video.id,
    title: video.snippet?.title || "",
    description: normalizeDescription(video.snippet?.description || ""),
    publishedAt: video.snippet?.publishedAt || "",
    thumbnail:
      video.snippet?.thumbnails?.maxres?.url ||
      video.snippet?.thumbnails?.standard?.url ||
      video.snippet?.thumbnails?.high?.url ||
      video.snippet?.thumbnails?.medium?.url ||
      "",
    viewCount: Number(video.statistics?.viewCount || 0),
    durationSeconds: parseDuration(video.contentDetails?.duration || ""),
    tags
  };
  const classification = categorizeEpisode({
    ...normalized,
    description: video.snippet?.description || ""
  });
  return { ...normalized, ...classification, ...identifyEpisodeGuests(normalized) };
}

function isEligible(video) {
  if (!video.videoId) return false;
  if (video.durationSeconds < MIN_STANDARD_VIDEO_SECONDS) return false;
  return !EXCLUDED_TITLE_PATTERNS.some(pattern => pattern.test(video.title));
}

module.exports = async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");

  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const key = process.env.YOUTUBE_API_KEY;

  if (!key) {
    return res.status(503).json({
      error: "YouTube feed is temporarily unavailable"
    });
  }

  try {
    const channelUrl = new URL(
      "https://www.googleapis.com/youtube/v3/channels"
    );

    channelUrl.search = new URLSearchParams({
      part: "id,contentDetails",
      forHandle: HANDLE,
      key
    });

    const channelData = await getJson(channelUrl);
    const channel = channelData.items?.[0];

    if (!channel) {
      return res.status(404).json({ error: "YouTube channel not found" });
    }

    const uploadsPlaylist =
      channel.contentDetails?.relatedPlaylists?.uploads;

    if (!uploadsPlaylist) {
      return res.status(404).json({
        error: "Uploads playlist not found"
      });
    }

    const ids = [];
    let pageToken = "";

    for (let page = 0; page < MAX_PAGES; page += 1) {
      const playlistUrl = new URL(
        "https://www.googleapis.com/youtube/v3/playlistItems"
      );

      playlistUrl.search = new URLSearchParams({
        part: "contentDetails",
        playlistId: uploadsPlaylist,
        maxResults: "50",
        ...(pageToken ? { pageToken } : {}),
        key
      });

      const playlistData = await getJson(playlistUrl);

      ids.push(
        ...(playlistData.items || [])
          .map(item => item.contentDetails?.videoId)
          .filter(Boolean)
      );

      pageToken = playlistData.nextPageToken || "";
      if (!pageToken) break;
    }

    const uniqueIds = [...new Set(ids)];
    const rawVideos = [];

    for (let i = 0; i < uniqueIds.length; i += 50) {
      const videoUrl = new URL(
        "https://www.googleapis.com/youtube/v3/videos"
      );

      videoUrl.search = new URLSearchParams({
        part: "snippet,statistics,contentDetails",
        id: uniqueIds.slice(i, i + 50).join(","),
        key
      });

      const data = await getJson(videoUrl);
      rawVideos.push(...(data.items || []));
    }

    const allVideos = rawVideos.map(normalizeVideo);
    let eligible = allVideos.filter(isEligible);

    // Safety fallback: if channel formatting changes or videos are unusually
    // short, still return non-Short uploads instead of an empty website.
    if (!eligible.length) {
      eligible = allVideos.filter(video =>
        video.videoId &&
        video.durationSeconds > 60 &&
        !EXCLUDED_TITLE_PATTERNS.some(pattern => pattern.test(video.title))
      );
    }

    // Final fallback: return all public uploads rather than null values.
    if (!eligible.length) {
      eligible = allVideos.filter(video => video.videoId);
    }

    const episodes = [...eligible].sort(
      (a, b) => new Date(b.publishedAt) - new Date(a.publishedAt)
    );

    const latest =
      [...episodes].sort(
        (a, b) => new Date(b.publishedAt) - new Date(a.publishedAt)
      )[0] || null;

    const mostWatched =
      [...episodes].sort((a, b) => b.viewCount - a.viewCount)[0] || null;

    const recent = episodes.slice(0, 6);
    const unresolvedGuestAudit = episodes
      .map(episode => episode.unresolvedGuestAudit)
      .filter(Boolean);

    // The public channel feed changes infrequently. A 15-minute CDN window
    // reduces repeated serverless work and YouTube API quota while still
    // allowing newly published episodes to surface promptly.
    res.setHeader(
      "Cache-Control",
      "s-maxage=900, stale-while-revalidate=21600"
    );

    return res.status(200).json({
      channelId: channel.id,
      scannedVideos: allVideos.length,
      eligibleVideos: eligible.length,
      latest,
      mostWatched,
      recent,
      episodes,
      unresolvedGuestAudit
    });
  } catch (error) {
    console.error("YouTube feed request failed", {
      name: error?.name || "Error",
      message: error?.message || "Unknown failure"
    });
    return res.status(502).json({
      error: "Unable to load YouTube episodes"
    });
  }
};
