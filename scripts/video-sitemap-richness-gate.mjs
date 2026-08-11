import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

const ROOT = process.cwd();
const errors = [];
const assert = (condition, message) => { if (!condition) errors.push(message); };
const read = relative => fs.readFileSync(path.join(ROOT, relative), "utf8");
const catalogUrl = pathToFileURL(path.join(ROOT, "src/data/catalog.js")).href;
const { episodes } = await import(catalogUrl);

function xmlDecode(value = "") {
  return String(value)
    .replace(/&apos;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&gt;/g, ">")
    .replace(/&lt;/g, "<")
    .replace(/&amp;/g, "&");
}

function structuredVideo(html) {
  const raw = html.match(/<script\s+[^>]*id=["']detail-structured-data["'][^>]*>([\s\S]*?)<\/script>/i)?.[1]?.trim();
  if (!raw) return null;
  try {
    const data = JSON.parse(raw);
    return (Array.isArray(data?.["@graph"]) ? data["@graph"] : []).find(node => node?.["@type"] === "VideoObject") || null;
  } catch {
    return null;
  }
}

function isoDurationSeconds(value = "") {
  const match = String(value).match(/^P(?:(\d+)D)?T(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/i);
  if (!match) return 0;
  return Number(match[1] || 0) * 86400 + Number(match[2] || 0) * 3600 + Number(match[3] || 0) * 60 + Number(match[4] || 0);
}

function sitemapEntries(xml) {
  const map = new Map();
  for (const match of xml.matchAll(/<url>([\s\S]*?)<\/url>/g)) {
    const block = match[1];
    const loc = xmlDecode(block.match(/<loc>([^<]+)<\/loc>/)?.[1] || "").trim();
    if (loc) map.set(loc, block);
  }
  return map;
}

const syncScript = read("scripts/sync-video-sitemap.mjs");
const sitemap = read("video-sitemap.xml");
const entries = sitemapEntries(sitemap);
let durationCount = 0;
let publicationCount = 0;

assert(syncScript.includes("structuredVideoFromPage"), "Video sitemap sync must derive optional metadata from permanent page structured data.");
assert(syncScript.includes('node?.["@type"] === "VideoObject"'), "Video sitemap sync must use the verified VideoObject entity.");
assert(syncScript.includes("<video:duration>"), "Video sitemap sync must support Google video duration metadata.");
assert(syncScript.includes("<video:publication_date>"), "Video sitemap sync must support Google video publication-date metadata.");
assert(syncScript.includes("total >= 1 && total <= 28800"), "Video duration must enforce Google's supported 1–28,800 second range.");

for (const episode of episodes) {
  const canonical = `https://thealanashow.com/episodes/${episode.id}`;
  const block = entries.get(canonical);
  assert(Boolean(block), `Video sitemap is missing permanent conversation: ${canonical}`);
  if (!block) continue;

  const html = read(`episodes/${episode.id}/index.html`);
  const video = structuredVideo(html);
  assert(Boolean(video), `${episode.id} is missing verified VideoObject structured data.`);
  if (!video) continue;

  const expectedDuration = isoDurationSeconds(video.duration);
  const actualDuration = Number(block.match(/<video:duration>(\d+)<\/video:duration>/)?.[1] || 0);
  if (expectedDuration >= 1 && expectedDuration <= 28800) {
    durationCount += 1;
    assert(actualDuration === expectedDuration, `${episode.id} video sitemap duration must match VideoObject: expected ${expectedDuration}, got ${actualDuration}.`);
  } else {
    assert(!actualDuration, `${episode.id} must not publish an unsupported duration value.`);
  }

  const expectedPublication = String(video.uploadDate || "").trim();
  const actualPublication = xmlDecode(block.match(/<video:publication_date>([^<]+)<\/video:publication_date>/)?.[1] || "").trim();
  if (expectedPublication && !Number.isNaN(Date.parse(expectedPublication))) {
    publicationCount += 1;
    assert(actualPublication === expectedPublication, `${episode.id} video sitemap publication date must match VideoObject uploadDate.`);
  } else {
    assert(!actualPublication, `${episode.id} must not publish an unverified publication date.`);
  }
}

assert(durationCount >= 20, `Expected rich duration metadata for at least 20 permanent videos, found ${durationCount}.`);
assert(publicationCount >= 20, `Expected publication-date metadata for at least 20 permanent videos, found ${publicationCount}.`);

if (errors.length) {
  console.error(`\nVideo sitemap richness gate failed with ${errors.length} issue${errors.length === 1 ? "" : "s"}:\n`);
  errors.forEach(error => console.error(`  - ${error}`));
  process.exit(1);
}

console.log("Video sitemap richness gate passed.");
console.log(`  Verified duration metadata: ${durationCount} videos`);
console.log(`  Verified publication-date metadata: ${publicationCount} videos`);
console.log("  Values match permanent VideoObject entities exactly: OK");
console.log("  No second metadata source or publishing chore introduced: OK");
