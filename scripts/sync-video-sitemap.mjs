import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

const ROOT = process.cwd();
const ORIGIN = "https://thealanashow.com";
const catalogUrl = pathToFileURL(path.join(ROOT, "src/data/catalog.js")).href;
const { episodes } = await import(catalogUrl);

const read = relative => fs.readFileSync(path.join(ROOT, relative), "utf8");
const xmlEscape = value => String(value ?? "")
  .replace(/&/g, "&amp;")
  .replace(/</g, "&lt;")
  .replace(/>/g, "&gt;")
  .replace(/"/g, "&quot;")
  .replace(/'/g, "&apos;");

function staticGraph(html, relative) {
  const match = html.match(/<script\s+id="detail-structured-data"\s+type="application\/ld\+json">([\s\S]*?)<\/script>/i);
  if (!match) throw new Error(`${relative} is missing static detail structured data.`);
  try {
    return JSON.parse(match[1]);
  } catch (error) {
    throw new Error(`${relative} contains invalid detail structured data: ${error.message}`);
  }
}

function sitemapLastmodMap() {
  const xml = read("sitemap.xml");
  const map = new Map();
  for (const match of xml.matchAll(/<url>\s*<loc>([^<]+)<\/loc>\s*<lastmod>([^<]+)<\/lastmod>\s*<\/url>/g)) {
    map.set(match[1], match[2]);
  }
  return map;
}

function isoDurationToSeconds(value = "") {
  const match = String(value).match(/^P(?:(\d+)D)?T(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/i);
  if (!match) return 0;
  return Number(match[1] || 0) * 86400
    + Number(match[2] || 0) * 3600
    + Number(match[3] || 0) * 60
    + Number(match[4] || 0);
}

const lastmods = sitemapLastmodMap();
const entries = [];

for (const episode of episodes) {
  const relative = `episodes/${episode.id}/index.html`;
  const absolute = path.join(ROOT, relative);
  if (!fs.existsSync(absolute)) throw new Error(`Missing permanent episode page: ${relative}`);

  const html = read(relative);
  const data = staticGraph(html, relative);
  const graph = Array.isArray(data?.["@graph"]) ? data["@graph"] : [];
  const video = graph.find(item => item?.["@type"] === "VideoObject");
  if (!video) throw new Error(`${relative} is missing a static VideoObject.`);

  const canonical = String(video.url || `${ORIGIN}/episodes/${episode.id}`);
  const title = String(video.name || "").trim();
  const description = String(video.description || "").replace(/\s+/g, " ").trim().slice(0, 2048);
  const thumbnail = Array.isArray(video.thumbnailUrl) ? video.thumbnailUrl[0] : video.thumbnailUrl;
  const player = String(video.embedUrl || `https://www.youtube-nocookie.com/embed/${episode.videoId}`);
  const uploadDate = String(video.uploadDate || "").trim();
  const durationSeconds = isoDurationToSeconds(video.duration);
  const lastmod = lastmods.get(canonical);

  if (!canonical.startsWith(`${ORIGIN}/episodes/`)) throw new Error(`${relative} has an unexpected canonical video URL.`);
  if (!title) throw new Error(`${relative} is missing a video title.`);
  if (!description) throw new Error(`${relative} is missing a video description.`);
  if (!/^https:\/\//i.test(String(thumbnail || ""))) throw new Error(`${relative} is missing an absolute HTTPS video thumbnail.`);
  if (!/^https:\/\/www\.youtube-nocookie\.com\/embed\/[A-Za-z0-9_-]{11}$/i.test(player)) {
    throw new Error(`${relative} has an unexpected or non-crawlable player URL.`);
  }

  const lines = [
    "  <url>",
    `    <loc>${xmlEscape(canonical)}</loc>`,
    ...(lastmod ? [`    <lastmod>${xmlEscape(lastmod)}</lastmod>`] : []),
    "    <video:video>",
    `      <video:thumbnail_loc>${xmlEscape(thumbnail)}</video:thumbnail_loc>`,
    `      <video:title>${xmlEscape(title)}</video:title>`,
    `      <video:description>${xmlEscape(description)}</video:description>`,
    `      <video:player_loc allow_embed="yes">${xmlEscape(player)}</video:player_loc>`,
    ...(durationSeconds > 0 && durationSeconds <= 28800 ? [`      <video:duration>${durationSeconds}</video:duration>`] : []),
    ...(uploadDate ? [`      <video:publication_date>${xmlEscape(uploadDate)}</video:publication_date>`] : []),
    "    </video:video>",
    "  </url>"
  ];
  entries.push(lines.join("\n"));
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
