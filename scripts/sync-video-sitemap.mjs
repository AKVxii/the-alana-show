import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

const ROOT = process.cwd();
const ORIGIN = "https://thealanashow.com";
const catalogUrl = pathToFileURL(path.join(ROOT, "src/data/catalog.js")).href;
const { episodes } = await import(catalogUrl);

const read = relative => fs.readFileSync(path.join(ROOT, relative), "utf8");
const decodeHtml = value => String(value ?? "")
  .replace(/&amp;/g, "&")
  .replace(/&quot;/g, '"')
  .replace(/&#0?39;/g, "'")
  .replace(/&apos;/g, "'")
  .replace(/&lt;/g, "<")
  .replace(/&gt;/g, ">");
const xmlEscape = value => String(value ?? "")
  .replace(/&/g, "&amp;")
  .replace(/</g, "&lt;")
  .replace(/>/g, "&gt;")
  .replace(/"/g, "&quot;")
  .replace(/'/g, "&apos;");

function normalizeThumbnailUrl(value = "") {
  try {
    const url = new URL(value);
    if (url.protocol !== "https:") return "";
    if (url.hostname === "i.ytimg.com") url.hostname = "img.youtube.com";
    return url.href;
  } catch {
    return "";
  }
}

function attribute(html, tagPattern, attributeName) {
  const tag = html.match(tagPattern)?.[0] || "";
  const match = tag.match(new RegExp(`${attributeName}=["']([^"']+)["']`, "i"));
  return decodeHtml(match?.[1] || "").trim();
}

function titleFromPage(html) {
  const ogTitle = attribute(html, /<meta\s+[^>]*property=["']og:title["'][^>]*>/i, "content");
  if (ogTitle) return ogTitle.replace(/\s*\|\s*The Alana Show\s*$/i, "").trim();
  const title = decodeHtml(html.match(/<title>([\s\S]*?)<\/title>/i)?.[1] || "");
  return title.replace(/\s*\|\s*The Alana Show\s*$/i, "").trim();
}

function structuredVideoFromPage(html) {
  const raw = html.match(/<script\s+[^>]*id=["']detail-structured-data["'][^>]*>([\s\S]*?)<\/script>/i)?.[1]?.trim();
  if (!raw) return null;
  try {
    const data = JSON.parse(raw);
    const graph = Array.isArray(data?.["@graph"]) ? data["@graph"] : [];
    return graph.find(node => node?.["@type"] === "VideoObject") || null;
  } catch {
    return null;
  }
}

function isoDurationSeconds(value = "") {
  const match = String(value).match(/^P(?:(\d+)D)?T(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/i);
  if (!match) return 0;
  const days = Number(match[1] || 0);
  const hours = Number(match[2] || 0);
  const minutes = Number(match[3] || 0);
  const seconds = Number(match[4] || 0);
  const total = days * 86400 + hours * 3600 + minutes * 60 + seconds;
  return Number.isInteger(total) && total >= 1 && total <= 28800 ? total : 0;
}

function validPublicationDate(value = "") {
  const candidate = String(value).trim();
  return candidate && !Number.isNaN(Date.parse(candidate)) ? candidate : "";
}

function sitemapLastmodMap() {
  const xml = read("sitemap.xml");
  const map = new Map();
  for (const match of xml.matchAll(/<url>\s*<loc>([^<]+)<\/loc>\s*<lastmod>([^<]+)<\/lastmod>\s*<\/url>/g)) {
    map.set(match[1], match[2]);
  }
  return map;
}

const lastmods = sitemapLastmodMap();
const entries = [];

for (const episode of episodes) {
  const relative = `episodes/${episode.id}/index.html`;
  const absolute = path.join(ROOT, relative);
  if (!fs.existsSync(absolute)) throw new Error(`Missing permanent episode page: ${relative}`);

  const html = read(relative);
  const canonical = attribute(html, /<link\s+[^>]*rel=["']canonical["'][^>]*>/i, "href") || `${ORIGIN}/episodes/${episode.id}`;
  const title = titleFromPage(html);
  const description = attribute(html, /<meta\s+[^>]*name=["']description["'][^>]*>/i, "content").replace(/\s+/g, " ").slice(0, 2048);
  const thumbnail = normalizeThumbnailUrl(attribute(html, /<meta\s+[^>]*property=["']og:image["'][^>]*>/i, "content"));
  const player = `https://www.youtube-nocookie.com/embed/${episode.videoId}`;
  const lastmod = lastmods.get(canonical);
  const structuredVideo = structuredVideoFromPage(html);
  const durationSeconds = isoDurationSeconds(structuredVideo?.duration);
  const publicationDate = validPublicationDate(structuredVideo?.uploadDate);

  if (!canonical.startsWith(`${ORIGIN}/episodes/`)) throw new Error(`${relative} has an unexpected canonical URL.`);
  if (!title) throw new Error(`${relative} is missing a video title.`);
  if (!description) throw new Error(`${relative} is missing a meta description.`);
  if (!/^https:\/\//i.test(thumbnail)) throw new Error(`${relative} is missing an absolute HTTPS video thumbnail.`);
  if (!/^[A-Za-z0-9_-]{11}$/.test(episode.videoId)) throw new Error(`${relative} has an invalid verified YouTube video ID.`);

  entries.push([
    "  <url>",
    `    <loc>${xmlEscape(canonical)}</loc>`,
    ...(lastmod ? [`    <lastmod>${xmlEscape(lastmod)}</lastmod>`] : []),
    "    <video:video>",
    `      <video:thumbnail_loc>${xmlEscape(thumbnail)}</video:thumbnail_loc>`,
    `      <video:title>${xmlEscape(title)}</video:title>`,
    `      <video:description>${xmlEscape(description)}</video:description>`,
    `      <video:player_loc allow_embed="yes">${xmlEscape(player)}</video:player_loc>`,
    ...(durationSeconds ? [`      <video:duration>${durationSeconds}</video:duration>`] : []),
    ...(publicationDate ? [`      <video:publication_date>${xmlEscape(publicationDate)}</video:publication_date>`] : []),
    "    </video:video>",
    "  </url>"
  ].join("\n"));
}

const output = [
  '<?xml version="1.0" encoding="UTF-8"?>',
  '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:video="http://www.google.com/schemas/sitemap-video/1.1">',
  ...entries,
  "</urlset>",
  ""
].join("\n");

fs.writeFileSync(path.join(ROOT, "video-sitemap.xml"), output);
console.log(`Video sitemap synced: ${entries.length} permanent conversation videos.`);
