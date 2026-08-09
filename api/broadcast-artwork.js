const COMMENTS_URL = "https://api.github.com/repos/AKVxii/the-alana-show/issues/34/comments?per_page=100";
const PARTS = 12;

export default async function handler(req, res) {
  try {
    const response = await fetch(COMMENTS_URL, {
      headers: {
        Accept: "application/vnd.github+json",
        "User-Agent": "the-alana-show-broadcast-artwork"
      }
    });

    if (!response.ok) throw new Error(`GitHub comments fetch failed: ${response.status}`);
    const comments = await response.json();
    const chunks = new Array(PARTS);

    for (const comment of comments) {
      const body = String(comment?.body || "");
      const match = body.match(/^BROADCAST_ASSET_BASE64_PART_(\d{2})_OF_12\n([A-Za-z0-9+/=\s]+)$/);
      if (!match) continue;
      const index = Number(match[1]) - 1;
      if (index >= 0 && index < PARTS) chunks[index] = match[2].replace(/\s+/g, "");
    }

    if (chunks.some(chunk => !chunk)) throw new Error("Approved broadcast artwork is incomplete");

    const image = Buffer.from(chunks.join(""), "base64");
    if (image.length < 12 || image.toString("ascii", 0, 4) !== "RIFF" || image.toString("ascii", 8, 12) !== "WEBP") {
      throw new Error("Approved broadcast artwork failed WebP validation");
    }

    res.statusCode = 200;
    res.setHeader("Content-Type", "image/webp");
    res.setHeader("Cache-Control", "public, max-age=3600, s-maxage=86400, stale-while-revalidate=3600");
    res.setHeader("Content-Length", String(image.length));
    return res.end(image);
  } catch (error) {
    console.error("broadcast artwork error", error);
    res.statusCode = 503;
    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    res.setHeader("Cache-Control", "no-store");
    return res.end("Broadcast artwork temporarily unavailable");
  }
}
