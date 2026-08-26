const STORAGE_KEY = "tas:youtube-feed:v1";
const FRESH_FOR_MS = 10 * 60 * 1000;
const MAX_STORED_BYTES = 1_250_000;
const REQUEST_TIMEOUT_MS = 5_000;
let inFlight = null;

function readCachedFeed() {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const cached = JSON.parse(raw);
    if (!cached?.savedAt || !cached?.data) return null;
    return cached;
  } catch {
    return null;
  }
}

function writeCachedFeed(data) {
  try {
    const payload = JSON.stringify({ savedAt: Date.now(), data });
    if (payload.length > MAX_STORED_BYTES) return;
    sessionStorage.setItem(STORAGE_KEY, payload);
  } catch {
    // Storage is an optimization only; never make the archive depend on it.
  }
}

export async function loadYouTubeFeed() {
  const cached = readCachedFeed();
  if (cached && Date.now() - cached.savedAt < FRESH_FOR_MS) return cached.data;
  if (inFlight) return inFlight;

  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  inFlight = fetch("/api/youtube", { headers: { Accept: "application/json" }, signal: controller.signal })
    .then(async response => {
      if (!response.ok) throw new Error("YouTube feed unavailable");
      const data = await response.json();
      writeCachedFeed(data);
      return data;
    })
    .catch(error => {
      if (cached?.data) return cached.data;
      throw error;
    })
    .finally(() => {
      window.clearTimeout(timeout);
      inFlight = null;
    });

  return inFlight;
}
