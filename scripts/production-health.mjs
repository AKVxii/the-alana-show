import path from "node:path";
import { pathToFileURL } from "node:url";

const ORIGIN = String(process.env.SITE_ORIGIN || "https://thealanashow.com").replace(/\/$/, "");
const REQUEST_TIMEOUT_MS = Number(process.env.HEALTH_TIMEOUT_MS || 15000);
const MAX_CONCURRENCY = Math.max(1, Math.min(12, Number(process.env.HEALTH_CONCURRENCY || 6)));
const errors = [];
const notes = [];

function fail(message) {
  errors.push(message);
}

function note(message) {
  notes.push(message);
}

async function request(url, options = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    return await fetch(url, {
      redirect: "follow",
      cache: "no-store",
      ...options,
      signal: controller.signal,
      headers: {
        "user-agent": "TheAlanaShow-ProductionHealth/1.0",
        "cache-control": "no-cache",
        ...(options.headers || {})
      }
    });
  } finally {
    clearTimeout(timer);
  }
}

async function getText(pathname) {
  const url = pathname.startsWith("http") ? pathname : `${ORIGIN}${pathname}`;
  try {
    const response = await request(url, { headers: { accept: "text/html,application/xml,text/plain;q=0.9,*/*;q=0.8" } });
    const text = await response.text();
    if (!response.ok) fail(`${url} returned HTTP ${response.status}.`);
    return { response, text, url };
  } catch (error) {
    fail(`${url} could not be fetched: ${error?.message || error}`);
    return { response: null, text: "", url };
  }
}

function extractLocs(xml) {
  return [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map(match => match[1].trim());
}

function canonicalFromHtml(html) {
  return html.match(/<link\s+rel=["']canonical["']\s+href=["']([^"']+)["']/i)?.[1]
    || html.match(/<link\s+href=["']([^"']+)["']\s+rel=["']canonical["']/i)?.[1]
    || "";
}

async function mapLimit(items, limit, worker) {
  let cursor = 0;
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (cursor < items.length) {
      const index = cursor++;
      await worker(items[index], index);
    }
  });
  await Promise.all(workers);
}

const catalogUrl = `${pathToFileURL(path.join(process.cwd(), "src/data/catalog.js")).href}?health=${Date.now()}`;
const { episodes: editorialEpisodes } = await import(catalogUrl);

const robots = await getText("/robots.txt");
if (robots.text) {
  if (!/User-agent:\s*\*/i.test(robots.text) || !/Allow:\s*\//i.test(robots.text)) fail("robots.txt does not clearly allow public crawling.");
  if (!robots.text.includes(`${ORIGIN}/sitemap.xml`)) fail("robots.txt does not advertise sitemap.xml.");
  if (!robots.text.includes(`${ORIGIN}/video-sitemap.xml`)) fail("robots.txt does not advertise video-sitemap.xml.");
}

const sitemap = await getText("/sitemap.xml");
if (sitemap.response) {
  const contentType = sitemap.response.headers.get("content-type") || "";
  if (!/xml/i.test(contentType)) fail(`sitemap.xml has unexpected content-type: ${contentType || "missing"}.`);
}
if (!/<urlset[\s>]/.test(sitemap.text)) fail("sitemap.xml is missing a urlset root.");
const sitemapUrls = extractLocs(sitemap.text);
if (!sitemapUrls.includes(`${ORIGIN}/`)) fail("sitemap.xml does not include the homepage.");
if (sitemapUrls.length < 20) fail(`sitemap.xml contains only ${sitemapUrls.length} URLs; expected the established site catalog.`);

const videoSitemap = await getText("/video-sitemap.xml");
if (videoSitemap.response) {
  const contentType = videoSitemap.response.headers.get("content-type") || "";
  if (!/xml/i.test(contentType)) fail(`video-sitemap.xml has unexpected content-type: ${contentType || "missing"}.`);
}
if (!videoSitemap.text.includes("xmlns:video=\"http://www.google.com/schemas/sitemap-video/1.1\"")) fail("video-sitemap.xml is missing the Google video namespace.");
if (!/<video:video>/.test(videoSitemap.text)) fail("video-sitemap.xml contains no video entries.");
if (!/<video:duration>\d+<\/video:duration>/.test(videoSitemap.text)) fail("video-sitemap.xml is missing video durations.");
if (!/<video:publication_date>[^<]+<\/video:publication_date>/.test(videoSitemap.text)) fail("video-sitemap.xml is missing publication dates.");

let liveFeed = null;
try {
  const response = await request(`${ORIGIN}/api/youtube`, { headers: { accept: "application/json" } });
  if (!response.ok) {
    fail(`/api/youtube returned HTTP ${response.status}.`);
  } else {
    liveFeed = await response.json();
    if (!Array.isArray(liveFeed?.episodes) || liveFeed.episodes.length < 1) fail("/api/youtube returned no eligible episodes.");
    else note(`YouTube API returned ${liveFeed.episodes.length} eligible videos.`);
  }
} catch (error) {
  fail(`/api/youtube could not be fetched or parsed: ${error?.message || error}`);
}

if (Array.isArray(liveFeed?.episodes)) {
  const liveIds = new Set(liveFeed.episodes.map(item => item.videoId));
  for (const episode of editorialEpisodes) {
    if (!liveIds.has(episode.videoId)) fail(`Verified episode ${episode.id} (${episode.videoId}) is absent from the live YouTube feed; it may be private, removed, or no longer eligible.`);
  }
}

await mapLimit(sitemapUrls, MAX_CONCURRENCY, async url => {
  const page = await getText(url);
  if (!page.response?.ok) return;
  const type = page.response.headers.get("content-type") || "";
  if (!/text\/html/i.test(type)) return;
  if (/name=["']robots["'][^>]*content=["'][^"']*noindex/i.test(page.text)) fail(`${url} unexpectedly contains a noindex directive.`);
  const canonical = canonicalFromHtml(page.text);
  if (!canonical) fail(`${url} has no canonical link.`);
});

await mapLimit(editorialEpisodes, MAX_CONCURRENCY, async episode => {
  const pathname = episode.detailPath || `/episodes/${episode.id}`;
  const url = `${ORIGIN}${pathname.startsWith("/") ? pathname : `/${pathname}`}`.replace(/\/$/, "");
  const page = await getText(url);
  if (!page.response?.ok) return;
  if (!page.text.includes(episode.videoId)) fail(`${episode.id} does not expose its verified YouTube ID in the static page.`);
  if (!page.text.includes(`youtube-nocookie.com/embed/${episode.videoId}`)) fail(`${episode.id} is missing its privacy-enhanced verified embed in static metadata.`);
  if (!page.text.includes('"@type":"VideoObject"') && !page.text.includes('"@type": "VideoObject"')) fail(`${episode.id} is missing VideoObject structured data.`);
});

if (errors.length) {
  console.error(`Production health audit FAILED with ${errors.length} issue${errors.length === 1 ? "" : "s"}:`);
  errors.forEach(error => console.error(`  - ${error}`));
  if (notes.length) {
    console.error("Notes:");
    notes.forEach(message => console.error(`  - ${message}`));
  }
  process.exit(1);
}

console.log("Production health audit passed.");
console.log(`  Origin: ${ORIGIN}`);
console.log(`  Sitemap URLs checked: ${sitemapUrls.length}`);
console.log(`  Verified episode masters checked: ${editorialEpisodes.length}`);
notes.forEach(message => console.log(`  ${message}`));
