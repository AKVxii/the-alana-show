const HANDLE = "@alanakvandeveer";
const MAX_PAGES = 4;

const EXCLUDED_TITLE_PATTERNS = [
  /\bshorts?\b/i,
  /\btrailer\b/i,
  /\bteaser\b/i,
  /\bpromo\b/i
];

async function getJson(url) {
  const response = await fetch(url);

  if (!response.ok) {
    const message = await response.text();

    throw new Error(
      `YouTube API returned ${response.status}: ${message}`
    );
  }

  return response.json();
}

function summarize(description = "") {
  return description
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 220);
}

function normalizeVideo(video) {
  return {
    videoId: video.id,

    title:
      video.snippet?.title ||
      "The Alana Show",

    description: summarize(
      video.snippet?.description || ""
    ),

    publishedAt:
      video.snippet?.publishedAt ||
      "",

    thumbnail:
      video.snippet?.thumbnails?.maxres?.url ||
      video.snippet?.thumbnails?.standard?.url ||
      video.snippet?.thumbnails?.high?.url ||
      video.snippet?.thumbnails?.medium?.url ||
      "",

    viewCount: Number(
      video.statistics?.viewCount || 0
    )
  };
}

function isEligibleVideo(video) {
  if (!video.videoId) {
    return false;
  }

  return !EXCLUDED_TITLE_PATTERNS.some(
    pattern => pattern.test(video.title)
  );
}

module.exports = async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");

    return res.status(405).json({
      error: "Method not allowed"
    });
  }

  const apiKey = process.env.YOUTUBE_API_KEY;

  if (!apiKey) {
    return res.status(503).json({
      error: "YOUTUBE_API_KEY is not configured"
    });
  }

  try {
    /*
     * STEP 1:
     * Find The Alana Show channel using its YouTube handle.
     */
    const channelUrl = new URL(
      "https://www.googleapis.com/youtube/v3/channels"
    );

    channelUrl.search = new URLSearchParams({
      part: "id,contentDetails",
      forHandle: HANDLE,
      key: apiKey
    });

    const channelData = await getJson(channelUrl);

    const channel = channelData.items?.[0];

    if (!channel) {
      return res.status(404).json({
        error: "The Alana Show YouTube channel was not found"
      });
    }

    /*
     * STEP 2:
     * Get the uploads playlist belonging to the channel.
     */
    const uploadsPlaylistId =
      channel.contentDetails
        ?.relatedPlaylists
        ?.uploads;

    if (!uploadsPlaylistId) {
      return res.status(404).json({
        error: "The channel uploads playlist was not found"
      });
    }

    /*
     * STEP 3:
     * Collect video IDs from the uploads playlist.
     */
    const videoIds = [];

    let nextPageToken = "";

    for (
      let page = 0;
      page < MAX_PAGES;
      page += 1
    ) {
      const playlistUrl = new URL(
        "https://www.googleapis.com/youtube/v3/playlistItems"
      );

      const playlistParams = {
        part: "contentDetails",
        playlistId: uploadsPlaylistId,
        maxResults: "50",
        key: apiKey
      };

      if (nextPageToken) {
        playlistParams.pageToken =
          nextPageToken;
      }

      playlistUrl.search =
        new URLSearchParams(
          playlistParams
        );

      const playlistData =
        await getJson(playlistUrl);

      const pageVideoIds =
        (playlistData.items || [])
          .map(
            item =>
              item.contentDetails?.videoId
          )
          .filter(Boolean);

      videoIds.push(...pageVideoIds);

      nextPageToken =
        playlistData.nextPageToken || "";

      if (!nextPageToken) {
        break;
      }
    }

    if (!videoIds.length) {
      return res.status(200).json({
        channelId: channel.id,
        scannedVideos: 0,
        eligibleVideos: 0,
        latest: null,
        mostWatched: null,
        recent: []
      });
    }

    /*
     * STEP 4:
     * Retrieve titles, descriptions, thumbnails,
     * publication dates and view counts.
     */
    const rawVideos = [];

    for (
      let index = 0;
      index < videoIds.length;
      index += 50
    ) {
      const group =
        videoIds.slice(
          index,
          index + 50
        );

      const videosUrl = new URL(
        "https://www.googleapis.com/youtube/v3/videos"
      );

      videosUrl.search =
        new URLSearchParams({
          part: "snippet,statistics",
          id: group.join(","),
          key: apiKey
        });

      const videosData =
        await getJson(videosUrl);

      rawVideos.push(
        ...(videosData.items || [])
      );
    }

    /*
     * STEP 5:
     * Normalize and lightly filter the results.
     */
    const allVideos =
      rawVideos.map(normalizeVideo);

    let eligibleVideos =
      allVideos.filter(
        isEligibleVideo
      );

    /*
     * Safety fallback:
     * Never leave the website empty merely because
     * every title matched a filter.
     */
    if (!eligibleVideos.length) {
      eligibleVideos = allVideos;
    }

    /*
     * STEP 6:
     * Find newest and most-watched videos.
     */
    const latest =
      [...eligibleVideos]
        .sort(
          (a, b) =>
            new Date(b.publishedAt) -
            new Date(a.publishedAt)
        )[0] || null;

    const mostWatched =
      [...eligibleVideos]
        .sort(
          (a, b) =>
            b.viewCount -
            a.viewCount
        )[0] || null;

    const recent =
      [...eligibleVideos]
        .sort(
          (a, b) =>
            new Date(b.publishedAt) -
            new Date(a.publishedAt)
        )
        .slice(0, 6);

    /*
     * Cache for five minutes.
     */
    res.setHeader(
      "Cache-Control",
      "s-maxage=300, stale-while-revalidate=3600"
    );

    return res.status(200).json({
      channelId: channel.id,
      scannedVideos: allVideos.length,
      eligibleVideos:
        eligibleVideos.length,
      latest,
      mostWatched,
      recent
    });
  } catch (error) {
    console.error(
      "YouTube function error:",
      error
    );

    return res.status(500).json({
      error:
        "Unable to load The Alana Show YouTube videos",
      detail: error.message
    });
  }
};
