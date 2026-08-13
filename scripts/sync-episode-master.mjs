import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { spawnSync } from "node:child_process";

const ROOT = process.cwd();
const ORIGIN = "https://thealanashow.com";
const slug = process.argv[2];
if (!slug || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
  console.error("Usage: node scripts/sync-episode-master.mjs <episode-slug>");
  process.exit(1);
}

const catalogUrl = `${pathToFileURL(path.join(ROOT, "src/data/catalog.js")).href}?sync=${Date.now()}`;
const { episodeById, guestById } = await import(catalogUrl);
const episode = episodeById(slug);
if (!episode) throw new Error(`Episode not found in catalog: ${slug}`);
if (!episode.canonical) throw new Error(`Episode ${slug} does not define canonical master metadata.`);

const canonical = episode.canonical;
const title = String(canonical.title || episode.title || "").trim();
const description = String(canonical.description || "").trim();
const publishedAt = String(canonical.publishedAt || "").trim();
const durationSeconds = Number(canonical.durationSeconds || 0);
const thumbnail = String(canonical.thumbnail || "").trim();
const videoId = String(episode.videoId || "").trim();

if (!/^[A-Za-z0-9_-]{11}$/.test(videoId)) throw new Error(`Invalid videoId for ${slug}.`);
if (!title || !description) throw new Error(`Canonical title and description are required for ${slug}.`);
if (!publishedAt || Number.isNaN(Date.parse(publishedAt))) throw new Error(`Canonical publishedAt must be a valid ISO date for ${slug}.`);
if (!Number.isFinite(durationSeconds) || durationSeconds <= 0) throw new Error(`Canonical durationSeconds must be positive for ${slug}.`);
if (!/^https:\/\//i.test(thumbnail)) throw new Error(`Canonical thumbnail must be absolute HTTPS for ${slug}.`);

const htmlEscape = value => String(value).replace(/[&<>"']/g, char => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;"
})[char]);
const isoDuration = total => {
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = Math.floor(total % 60);
  return `PT${hours ? `${hours}H` : ""}${minutes ? `${minutes}M` : ""}${seconds || (!hours && !minutes) ? `${seconds}S` : ""}`;
};
const displayDuration = total => {
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = Math.floor(total % 60);
  return hours ? `${hours}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}` : `${minutes}:${String(seconds).padStart(2, "0")}`;
};
const displayDate = value => new Intl.DateTimeFormat("en-US", {
  timeZone: "UTC", year: "numeric", month: "long", day: "numeric"
}).format(new Date(value));
const conciseDescription = (() => {
  const firstParagraph = description.split(/\n\s*\n/)[0].replace(/\s+/g, " ").trim();
  if (firstParagraph.length <= 220) return firstParagraph;
  return `${firstParagraph.slice(0, 217).trim()}…`;
})();
const episodeTitle = `${title} | The Alana Show`;
const canonicalUrl = `${ORIGIN}/episodes/${slug}`;
const guests = (episode.guestIds || []).map(guestById).filter(Boolean);
const guestLinks = guests.map(guest => `<a href="/guests/${guest.id}">${htmlEscape(guest.name)}</a>`).join(" and ");
const overviewHtml = description.split(/\n\s*\n/).map(paragraph => `<p>${htmlEscape(paragraph).replace(/\n/g, "<br>")}</p>`).join("");

const pagePath = path.join(ROOT, "episodes", slug, "index.html");
if (!fs.existsSync(pagePath)) throw new Error(`Permanent episode page is missing: episodes/${slug}/index.html`);
let html = fs.readFileSync(pagePath, "utf8");

function replaceOne(pattern, replacement, label) {
  const matches = html.match(pattern);
  if (!matches) throw new Error(`Could not update ${label} in episodes/${slug}/index.html`);
  html = html.replace(pattern, replacement);
}

replaceOne(/<meta name="description" content="[^"]*">/, `<meta name="description" content="${htmlEscape(conciseDescription)}">`, "meta description");
replaceOne(/<meta property="og:title" content="[^"]*">/, `<meta property="og:title" content="${htmlEscape(episodeTitle)}">`, "Open Graph title");
replaceOne(/<meta property="og:description" content="[^"]*">/, `<meta property="og:description" content="${htmlEscape(conciseDescription)}">`, "Open Graph description");
replaceOne(/<meta property="og:image" content="[^"]*">/, `<meta property="og:image" content="${thumbnail}">`, "Open Graph image");
replaceOne(/<meta property="og:image:alt" content="[^"]*">/, `<meta property="og:image:alt" content="${htmlEscape(title)}">`, "Open Graph image alt");
replaceOne(/<meta name="twitter:title" content="[^"]*">/, `<meta name="twitter:title" content="${htmlEscape(episodeTitle)}">`, "Twitter title");
replaceOne(/<meta name="twitter:description" content="[^"]*">/, `<meta name="twitter:description" content="${htmlEscape(conciseDescription)}">`, "Twitter description");
replaceOne(/<meta name="twitter:image" content="[^"]*">/, `<meta name="twitter:image" content="${thumbnail}">`, "Twitter image");
replaceOne(/<meta name="twitter:image:alt" content="[^"]*">/, `<meta name="twitter:image:alt" content="${htmlEscape(title)}">`, "Twitter image alt");
replaceOne(/<title>[^<]*<\/title>/, `<title>${htmlEscape(episodeTitle)}</title>`, "document title");

const scriptPattern = /<script id="detail-structured-data" type="application\/ld\+json">([\s\S]*?)<\/script>/;
const scriptMatch = html.match(scriptPattern);
if (!scriptMatch) throw new Error(`Structured data block is missing for ${slug}.`);
const structured = JSON.parse(scriptMatch[1]);
const graph = structured["@graph"] || [];
const webPage = graph.find(node => node["@type"] === "WebPage");
const breadcrumb = graph.find(node => node["@type"] === "BreadcrumbList");
let video = graph.find(node => node["@type"] === "VideoObject");
if (!webPage || !breadcrumb || !video) throw new Error(`Expected WebPage, BreadcrumbList, and VideoObject nodes for ${slug}.`);
webPage.name = episodeTitle;
webPage.description = conciseDescription;
webPage.primaryImageOfPage = { "@type": "ImageObject", url: thumbnail };
webPage.datePublished = publishedAt;
webPage.mainEntity = { "@id": `${canonicalUrl}#video` };
const currentCrumb = breadcrumb.itemListElement?.find(item => item.position === 3);
if (currentCrumb) currentCrumb.name = title;
video.name = title;
video.description = description.replace(/\s+/g, " ").trim();
video.thumbnailUrl = [thumbnail];
video.uploadDate = publishedAt;
video.embedUrl = `https://www.youtube-nocookie.com/embed/${videoId}`;
video.url = canonicalUrl;
video.duration = isoDuration(durationSeconds);
video.about = guests.map(guest => ({
  "@type": "Person",
  "@id": `${ORIGIN}/guests/${guest.id}#person`,
  name: guest.name,
  url: `${ORIGIN}/guests/${guest.id}`
}));
replaceOne(scriptPattern, `<script id="detail-structured-data" type="application/ld+json">${JSON.stringify(structured).replace(/</g, "\\u003c")}</script>`, "structured data");

replaceOne(/<li aria-current="page">[^<]*<\/li>/, `<li aria-current="page">${htmlEscape(title)}</li>`, "breadcrumb title");
replaceOne(/<h1>[^<]*<\/h1>/, `<h1>${htmlEscape(title)}</h1>`, "episode heading");
if (guestLinks) replaceOne(/<p class="detail-byline">A conversation with [\s\S]*?<\/p>/, `<p class="detail-byline">A conversation with ${guestLinks}</p>`, "guest byline");
replaceOne(/<p class="detail-byline">[A-Z][a-z]+ \d{1,2}, \d{4} · [^<]+<\/p>/, `<p class="detail-byline">${displayDate(publishedAt)} · ${displayDuration(durationSeconds)}</p>`, "published date and duration");
replaceOne(/<section class="related-section" data-static-episode-overview[\s\S]*?<\/section>(?=<section class="related-section" data-static-episode-topics)/, `<section class="related-section" data-static-episode-overview aria-labelledby="static-overview-heading"><p class="related-eyebrow"><span></span>ABOUT THIS CONVERSATION</p><h2 id="static-overview-heading">Episode overview</h2>${overviewHtml}</section>`, "episode overview");
replaceOne(/href="https:\/\/www\.youtube\.com\/watch\?v=[A-Za-z0-9_-]{11}"/, `href="https://www.youtube.com/watch?v=${videoId}"`, "YouTube watch link");

fs.writeFileSync(pagePath, html);

const hubPath = path.join(ROOT, "episodes", "index.html");
let hub = fs.readFileSync(hubPath, "utf8");
const escapedSlug = slug.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const itemPattern = new RegExp(`(\\"name\\":\\")[^\\"]*(\\",\\"item\\":\\"${ORIGIN.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\/episodes\\/${escapedSlug}\\")`);
if (!itemPattern.test(hub)) throw new Error(`Could not locate ${slug} in episode hub ItemList.`);
hub = hub.replace(itemPattern, `$1${title.replace(/"/g, '\\"')}$2`);
const linkPattern = new RegExp(`(<li><a href=\\"\\/episodes\\/${escapedSlug}\\">)[\\s\\S]*?(<\\/a><\\/li>)`);
if (!linkPattern.test(hub)) throw new Error(`Could not locate ${slug} in episode hub fallback list.`);
hub = hub.replace(linkPattern, `$1${htmlEscape(title)}$2`);
fs.writeFileSync(hubPath, hub);

const videoSitemap = spawnSync(process.execPath, ["scripts/sync-video-sitemap.mjs"], { cwd: ROOT, stdio: "inherit" });
if (videoSitemap.status !== 0) process.exit(videoSitemap.status || 1);
const standardSitemap = spawnSync(process.execPath, ["scripts/sync-sitemap-freshness.mjs"], { cwd: ROOT, stdio: "inherit" });
if (standardSitemap.status !== 0) process.exit(standardSitemap.status || 1);
console.log(`Episode master synchronized: ${slug} -> ${videoId}`);
