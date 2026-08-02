const HANDLE = "@alanakvandeveer";
const MAX_PAGES = 4;
const MIN_STANDARD_VIDEO_SECONDS = 90;
const EXCLUDED_TITLE_PATTERNS = [
  /\bshorts?\b/i,
  /\btrailer\b/i,
  /\bteaser\b/i,
  /\bpromo\b/i
];

function parseDuration(value = "PT0S") {
  const match = value.match(/P(?:(\d+)D)?T?(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return 0;
  const days = Number(match[1] || 0);
  const hours = Number(match[2] || 0);
  const minutes = Number(match[3] || 0);
  const seconds = Number(match[4] || 0);
  return days * 86400 + hours * 3600 + minutes * 60 + seconds;
}

function summarize(description = "") {
  return description.replace(/\s+/g, " ").trim().slice(0, 320);
}

async function getJson(url) {
  const response = await fetch(url);
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`YouTube API error ${response.status}: ${text}`);
  }
  return response.json();
}

function normalizeVideo(video) {
  return {
    videoId: video.id,
    title: video.snippet?.title || "",
    description: summarize(video.snippet?.description || ""),
    publishedAt: video.snippet?.publishedAt || "",
    thumbnail:
      video.snippet?.thumbnails?.maxres?.url ||
      video.snippet?.thumbnails?.standard?.url ||
      video.snippet?.thumbnails?.high?.url ||
      video.snippet?.thumbnails?.medium?.url ||
      "",
    viewCount: Number(video.statistics?.viewCount || 0),
    durationSeconds: parseDuration(video.contentDetails?.duration || "")
  };
}

function isEligible(video) {
  if (!video.videoId) return false;
  if (video.durationSeconds < MIN_STANDARD_VIDEO_SECONDS) return false;
  return !EXCLUDED_TITLE_PATTERNS.some(pattern => pattern.test(video.title));
}

module.exports = async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const key = process.env.YOUTUBE_API_KEY;
  if (!key) return res.status(503).json({ error: "YOUTUBE_API_KEY is not configured" });

  try {
    const channelUrl = new URL("https://www.googleapis.com/youtube/v3/channels");
    channelUrl.search = new URLSearchParams({ part: "id,contentDetails", forHandle: HANDLE, key });
    const channelData = await getJson(channelUrl);
    const channel = channelData.items?.[0];
    if (!channel) return res.status(404).json({ error: "YouTube channel not found" });

    const uploadsPlaylist = channel.contentDetails?.relatedPlaylists?.uploads;
    if (!uploadsPlaylist) return res.status(404).json({ error: "Uploads playlist not found" });

    const ids = [];
    let pageToken = "";

    for (let page = 0; page < MAX_PAGES; page += 1) {
      const playlistUrl = new URL("https://www.googleapis.com/youtube/v3/playlistItems");
      playlistUrl.search = new URLSearchParams({
        part: "contentDetails",
        playlistId: uploadsPlaylist,
        maxResults: "50",
        ...(pageToken ? { pageToken } : {}),
        key
      });
      const playlistData = await getJson(playlistUrl);
      ids.push(...(playlistData.items || []).map(item => item.contentDetails?.videoId).filter(Boolean));
      pageToken = playlistData.nextPageToken || "";
      if (!pageToken) break;
    }

    const rawVideos = [];
    for (let index = 0; index < ids.length; index += 50) {
      const videoUrl = new URL("https://www.googleapis.com/youtube/v3/videos");
      videoUrl.search = new URLSearchParams({
        part: "snippet,statistics,contentDetails",
        id: ids.slice(index, index + 50).join(","),
        key
      });
      const data = await getJson(videoUrl);
      rawVideos.push(...(data.items || []));
    }

    const allVideos = rawVideos.map(normalizeVideo);
    let eligible = allVideos.filter(isEligible);
    if (!eligible.length) {
      eligible = allVideos.filter(video =>
        video.videoId &&
        video.durationSeconds > 60 &&
        !EXCLUDED_TITLE_PATTERNS.some(pattern => pattern.test(video.title))
      );
    }
    if (!eligible.length) eligible = allVideos.filter(video => video.videoId);

    const episodes = [...eligible].sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));
    const latest = episodes[0] || null;
    const mostWatched = [...eligible].sort((a, b) => b.viewCount - a.viewCount)[0] || null;

    const requestedFeaturedId = process.env.FEATURED_YOUTUBE_VIDEO_ID;
    const featured = requestedFeaturedId
      ? eligible.find(video => video.videoId === requestedFeaturedId) || mostWatched
      : mostWatched;

    res.setHeader("Cache-Control", "s-maxage=300, stale-while-revalidate=3600");
    return res.status(200).json({
      channelId: channel.id,
      scannedVideos: allVideos.length,
      eligibleVideos: eligible.length,
      latest,
      featured,
      mostWatched,
      recent: episodes.slice(0, 8),
      episodes: episodes.slice(0, 100)
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Unable to load YouTube episodes", detail: error.message });
  }
};
