import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

const ROOT = process.cwd();
const ORIGIN = "https://thealanashow.com";
const catalogUrl = `${pathToFileURL(path.join(ROOT, "src/data/catalog.js")).href}?archiveSeo=${Date.now()}`;
const { episodes } = await import(catalogUrl);
const errors = [];

function read(relative) {
  const absolute = path.join(ROOT, relative);
  if (!fs.existsSync(absolute)) {
    errors.push(`Missing required archive file: ${relative}`);
    return "";
  }
  return fs.readFileSync(absolute, "utf8");
}

function decode(value = "") {
  return String(value)
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

function htmlTitle(html) {
  return decode(html.match(/<title>([\s\S]*?)<\/title>/i)?.[1] || "").trim();
}

function archiveTitle(html) {
  return htmlTitle(html).replace(/\s*\|\s*The Alana Show\s*$/i, "").trim();
}

function metaContent(html, attribute, key) {
  const match = html.match(new RegExp(`<meta\\s+${attribute}="${key}"\\s+content="([^"]*)"`, "i"));
  return decode(match?.[1] || "").trim();
}

function h1(html) {
  return decode(html.match(/<h1(?:\s[^>]*)?>([\s\S]*?)<\/h1>/i)?.[1] || "")
    .replace(/<[^>]+>/g, "")
    .trim();
}

function jsonLdGraph(html) {
  const raw = html.match(/<script\s+id="detail-structured-data"\s+type="application\/ld\+json">([\s\S]*?)<\/script>/i)?.[1] || "";
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed?.["@graph"]) ? parsed["@graph"] : [];
  } catch (error) {
    errors.push(`Invalid detail structured data JSON: ${error.message}`);
    return [];
  }
}

function xmlValue(block, tag) {
  const escaped = tag.replace(":", "\\:");
  return decode(block.match(new RegExp(`<${escaped}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${escaped}>`, "i"))?.[1] || "").trim();
}

function sitemapEntry(xml, canonical) {
  const blocks = xml.match(/<url>[\s\S]*?<\/url>/gi) || [];
  return blocks.find(block => xmlValue(block, "loc") === canonical) || "";
}

const videoSitemap = read("video-sitemap.xml");
const seenTitles = new Map();
const seenDescriptions = new Map();
let checked = 0;

for (const episode of episodes) {
  const file = `episodes/${episode.id}/index.html`;
  const html = read(file);
  if (!html) continue;

  const canonical = `${ORIGIN}/episodes/${episode.id}`;
  const title = archiveTitle(html);
  const fullTitle = htmlTitle(html);
  const description = metaContent(html, "name", "description");
  const ogTitle = metaContent(html, "property", "og:title");
  const ogDescription = metaContent(html, "property", "og:description");
  const pageH1 = h1(html);
  const graph = jsonLdGraph(html);
  const video = graph.find(item => item?.["@type"] === "VideoObject");
  const webPage = graph.find(item => item?.["@type"] === "WebPage");
  const sitemap = sitemapEntry(videoSitemap, canonical);
  const sitemapTitle = xmlValue(sitemap, "video:title");
  const sitemapDescription = xmlValue(sitemap, "video:description");
  const sitemapThumbnail = xmlValue(sitemap, "video:thumbnail_loc");
  const sitemapDuration = Number(xmlValue(sitemap, "video:duration"));
  const sitemapPublished = xmlValue(sitemap, "video:publication_date");

  if (!title) errors.push(`${file} must provide a descriptive server-delivered title.`);
  if (/^conversation\s+with\b/i.test(title)) errors.push(`${file} still uses a generic “Conversation with …” archive title.`);
  if (!fullTitle.endsWith("| The Alana Show")) errors.push(`${file} title must retain The Alana Show branding.`);
  if (pageH1 !== title) errors.push(`${file} crawler-visible H1 must match its archive title.`);
  if (description.length < 45) errors.push(`${file} meta description is too thin for a durable archive result.`);
  if (description.length > 220) errors.push(`${file} meta description should remain concise (220 characters or fewer).`);
  if (ogTitle !== fullTitle) errors.push(`${file} Open Graph title must match the server-delivered page title.`);
  if (ogDescription !== description) errors.push(`${file} Open Graph description must match the server-delivered meta description.`);
  if (!html.includes(`<link rel="canonical" href="${canonical}">`)) errors.push(`${file} canonical URL is missing or inconsistent.`);

  if (!video) {
    errors.push(`${file} must expose a VideoObject in server-delivered structured data.`);
  } else {
    if (!video.name) errors.push(`${file} VideoObject is missing a name.`);
    if (!video.description) errors.push(`${file} VideoObject is missing a description.`);
    if (!Array.isArray(video.thumbnailUrl) || !video.thumbnailUrl[0]) errors.push(`${file} VideoObject is missing a thumbnail.`);
    if (!video.uploadDate) errors.push(`${file} VideoObject is missing an upload date.`);
    if (!/^PT(?=\d|.*\d)[0-9HMS]+$/i.test(String(video.duration || ""))) errors.push(`${file} VideoObject is missing a valid duration.`);
    if (!String(video.embedUrl || "").includes(episode.videoId)) errors.push(`${file} VideoObject embed URL must use verified video ${episode.videoId}.`);
  }

  if (!webPage?.datePublished) errors.push(`${file} WebPage structured data is missing datePublished.`);
  if (!sitemap) {
    errors.push(`${file} is missing from video-sitemap.xml.`);
  } else {
    if (sitemapTitle !== title) errors.push(`${file} title does not match its video sitemap title.`);
    if (sitemapDescription !== description) errors.push(`${file} description does not match its video sitemap description.`);
    if (!sitemapThumbnail || !sitemapThumbnail.includes(episode.videoId)) errors.push(`${file} video sitemap thumbnail must use verified video ${episode.videoId}.`);
    if (!Number.isFinite(sitemapDuration) || sitemapDuration <= 0) errors.push(`${file} video sitemap is missing a valid duration.`);
    if (!sitemapPublished) errors.push(`${file} video sitemap is missing a publication date.`);
    if (video?.thumbnailUrl?.[0] && sitemapThumbnail !== video.thumbnailUrl[0]) errors.push(`${file} static VideoObject and video sitemap thumbnails must match.`);
    if (video?.uploadDate && sitemapPublished !== video.uploadDate) errors.push(`${file} static VideoObject and video sitemap publication dates must match.`);
  }

  const normalizedTitle = title.toLowerCase();
  const priorTitle = seenTitles.get(normalizedTitle);
  if (priorTitle && priorTitle !== episode.id) errors.push(`${file} duplicates the archive title used by ${priorTitle}.`);
  else if (normalizedTitle) seenTitles.set(normalizedTitle, episode.id);

  const normalizedDescription = description.toLowerCase();
  const priorDescription = seenDescriptions.get(normalizedDescription);
  if (priorDescription && priorDescription !== episode.id) errors.push(`${file} duplicates the meta description used by ${priorDescription}.`);
  else if (normalizedDescription) seenDescriptions.set(normalizedDescription, episode.id);

  checked += 1;
}

if (errors.length) {
  console.error(`Archive SEO gate failed with ${errors.length} issue${errors.length === 1 ? "" : "s"}:`);
  errors.forEach(error => console.error(`  - ${error}`));
  process.exit(1);
}

console.log("Archive SEO gate passed.");
console.log(`  Distinct server-delivered episode titles/descriptions: ${checked}`);
console.log("  Canonical URLs + VideoObject date/duration/thumbnail: aligned");
console.log("  Static episode metadata + video sitemap: aligned");