const HANDLE = "@alanakvandeveer";
const MAX_PAGES = 4;
const MIN_DURATION_SECONDS = 15 * 60;
const EXCLUDED_TITLE_WORDS = ["short", "shorts", "clip", "trailer", "teaser", "promo"];

function parseDuration(value = "PT0S") {
  const match = value.match(/P(?:(\d+)D)?T?(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return 0;
  const [, days = 0, hours = 0, minutes = 0, seconds = 0] = match.map(Number);
  return days * 86400 + hours * 3600 + minutes * 60 + seconds;
}

function summarize(description = "") {
  return description.replace(/\s+/g, " ").trim().slice(0, 220);
}

async function getJson(url) {
  const response = await fetch(url);
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`YouTube API error ${response.status}: ${text}`);
  }
  return response.json();
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
    channelUrl.search = new URLSearchParams({
      part: "id,contentDetails",
      forHandle: HANDLE,
      key
    });

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

    const videos = [];
    for (let i = 0; i < ids.length; i += 50) {
      const videoUrl = new URL("https://www.googleapis.com/youtube/v3/videos");
      videoUrl.search = new URLSearchParams({
        part: "snippet,statistics,contentDetails",
        id: ids.slice(i, i + 50).join(","),
        key
      });

      const data = await getJson(videoUrl);
      videos.push(...(data.items || []));
    }

    const eligible = videos
      .map(video => ({
        videoId: video.id,
        title: video.snippet?.title || "",
        description: summarize(video.snippet?.description || ""),
        publishedAt: video.snippet?.publishedAt || "",
        thumbnail:
          video.snippet?.thumbnails?.maxres?.url ||
          video.snippet?.thumbnails?.high?.url ||
          video.snippet?.thumbnails?.medium?.url ||
          "",
        viewCount: Number(video.statistics?.viewCount || 0),
        durationSeconds: parseDuration(video.contentDetails?.duration || "")
      }))
      .filter(video => video.durationSeconds >= MIN_DURATION_SECONDS)
      .filter(video => !EXCLUDED_TITLE_WORDS.some(word => video.title.toLowerCase().includes(word)));

    const latest = [...eligible].sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt))[0] || null;
    const mostWatched = [...eligible].sort((a, b) => b.viewCount - a.viewCount)[0] || null;
    const recent = [...eligible].sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt)).slice(0, 6);

    res.setHeader("Cache-Control", "s-maxage=3600, stale-while-revalidate=86400");
    return res.status(200).json({ channelId: channel.id, latest, mostWatched, recent });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Unable to load YouTube episodes" });
  }
};
