import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

const ROOT = process.cwd();
const ORIGIN = "https://thealanashow.com";
const failures = [];
const fail = message => failures.push(message);
const read = relative => {
  const absolute = path.join(ROOT, relative);
  if (!fs.existsSync(absolute)) {
    fail(`Missing required file: ${relative}`);
    return "";
  }
  return fs.readFileSync(absolute, "utf8");
};

const catalogUrl = pathToFileURL(path.join(ROOT, "src/data/catalog.js")).href;
const { episodes } = await import(catalogUrl);
const xml = read("video-sitemap.xml");
const robots = read("robots.txt");

if (!xml.includes('xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"')) {
  fail("Video sitemap is missing the standard sitemap namespace.");
}
if (!xml.includes('xmlns:video="http://www.google.com/schemas/sitemap-video/1.1"')) {
  fail("Video sitemap is missing Google's video namespace.");
}
if (!robots.includes("Sitemap: https://thealanashow.com/video-sitemap.xml")) {
  fail("robots.txt must advertise the video sitemap.");
}

const entries = [...xml.matchAll(/<url>([\s\S]*?)<\/url>/g)].map(match => match[1]);
if (entries.length !== episodes.length) {
  fail(`Video sitemap entry count ${entries.length} does not match verified episode count ${episodes.length}.`);
}

const locs = entries.map(entry => entry.match(/<loc>([^<]+)<\/loc>/)?.[1] || "");
const duplicateLocs = [...new Set(locs.filter((loc, index) => loc && locs.indexOf(loc) !== index))];
if (duplicateLocs.length) fail(`Duplicate video sitemap URLs: ${duplicateLocs.join(", ")}`);

const today = new Date();
today.setUTCHours(23, 59, 59, 999);

for (const episode of episodes) {
  const canonical = `${ORIGIN}/episodes/${episode.id}`;
  const expectedPlayer = `https://www.youtube-nocookie.com/embed/${episode.videoId}`;
  const matches = entries.filter(entry => entry.includes(`<loc>${canonical}</loc>`));

  if (matches.length !== 1) {
    fail(`${canonical} must appear exactly once in video-sitemap.xml; found ${matches.length}.`);
    continue;
  }

  const entry = matches[0];
  const thumbnail = entry.match(/<video:thumbnail_loc>([^<]+)<\/video:thumbnail_loc>/)?.[1] || "";
  const title = entry.match(/<video:title>([\s\S]*?)<\/video:title>/)?.[1] || "";
  const description = entry.match(/<video:description>([\s\S]*?)<\/video:description>/)?.[1] || "";
  const player = entry.match(/<video:player_loc(?:\s+allow_embed="yes")?>([^<]+)<\/video:player_loc>/)?.[1] || "";
  const lastmod = entry.match(/<lastmod>([^<]+)<\/lastmod>/)?.[1] || "";

  if (!/^https:\/\//i.test(thumbnail)) fail(`${canonical} is missing an absolute HTTPS video thumbnail.`);
  try {
    if (new URL(thumbnail).hostname !== "img.youtube.com") fail(`${canonical} thumbnail must use the working official YouTube image host.`);
  } catch {
    fail(`${canonical} has an invalid video thumbnail URL.`);
  }
  if (!title.trim()) fail(`${canonical} is missing video:title.`);
  if (title.replace(/&(?:amp|quot|apos|lt|gt);/g, "x").length > 100) fail(`${canonical} video:title exceeds 100 characters.`);
  if (!description.trim()) fail(`${canonical} is missing video:description.`);
  if (description.replace(/&(?:amp|quot|apos|lt|gt);/g, "x").length > 2048) fail(`${canonical} video:description exceeds 2048 characters.`);
  if (player !== expectedPlayer) fail(`${canonical} must use verified privacy-enhanced player URL ${expectedPlayer}.`);
  if (!entry.includes('<video:player_loc allow_embed="yes">')) fail(`${canonical} player must explicitly allow embedding.`);

  if (!/^\d{4}-\d{2}-\d{2}$/.test(lastmod)) {
    fail(`${canonical} has an invalid or missing lastmod date.`);
  } else {
    const parsed = new Date(`${lastmod}T00:00:00Z`);
    if (Number.isNaN(parsed.valueOf()) || parsed > today) fail(`${canonical} has a future or invalid lastmod date.`);
  }
}

for (const loc of locs) {
  if (!loc.startsWith(`${ORIGIN}/episodes/`)) fail(`Video sitemap contains non-episode URL: ${loc || "(missing loc)"}`);
}

const videoBlocks = (xml.match(/<video:video>/g) || []).length;
if (videoBlocks !== entries.length) fail(`Each sitemap URL must contain exactly one video:video block; found ${videoBlocks} for ${entries.length} URLs.`);

if (failures.length) {
  console.error("Video sitemap gate failed:");
  failures.forEach(message => console.error(`- ${message}`));
  process.exit(1);
}

console.log(`Video sitemap gate passed: ${entries.length} verified permanent conversation videos.`);
console.log("  Canonicals, thumbnails, titles, descriptions, privacy-enhanced player URLs, lastmod dates and robots discovery: OK");
