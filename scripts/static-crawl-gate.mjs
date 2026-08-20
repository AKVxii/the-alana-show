import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

const ROOT = process.cwd();
const catalogUrl = pathToFileURL(path.join(ROOT, "src/data/catalog.js")).href;
const { episodes, guests } = await import(catalogUrl);
const errors = [];

const escapeHtml = value => String(value ?? "").replace(/[&<>"']/g, char => ({
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#039;"
})[char]);

function read(relative) {
  const absolute = path.join(ROOT, relative);
  if (!fs.existsSync(absolute)) {
    errors.push(`Missing archive page: ${relative}`);
    return "";
  }
  return fs.readFileSync(absolute, "utf8");
}

for (const episode of episodes) {
  const file = `episodes/${episode.id}/index.html`;
  const html = read(file);
  if (!html) continue;
  if (!html.includes('data-static-crawl-fallback="episode"')) {
    errors.push(`${file} must include a crawler-visible static episode fallback.`);
  }
  if (html.includes('<div id="app"></div>')) {
    errors.push(`${file} must not ship as an empty JavaScript-only app shell.`);
  }
  if (!html.includes('id="detail-structured-data"')) {
    errors.push(`${file} must ship static detail structured data before JavaScript runs.`);
  }
  if (!html.includes('data-static-episode-overview')) {
    errors.push(`${file} must expose a crawler-visible episode overview before JavaScript runs.`);
  }
  if (html.includes('data-static-episode-topics') && !html.includes('href="/topics/')) {
    errors.push(`${file} static topic discovery must use permanent topic authority links.`);
  }
  if (!html.includes('"@type":"VideoObject"')) {
    errors.push(`${file} must ship a static VideoObject from verified YouTube metadata.`);
  }
  if (!html.includes('"@type":"SeekToAction"')) {
    errors.push(`${file} must retain static video key-moment seeking markup.`);
  }
  if (!html.includes('property="og:image:alt"') || !html.includes('name="twitter:image:alt"')) {
    errors.push(`${file} must include accessible social-image alt metadata.`);
  }
  for (const guestId of episode.guestIds || []) {
    if (!html.includes(`href="/guests/${guestId}"`)) {
      errors.push(`${file} must expose a direct crawlable link to guest ${guestId}.`);
    }
  }
  if (!html.includes(`https://www.youtube.com/watch?v=${episode.videoId}`)) {
    errors.push(`${file} must expose a direct YouTube watch fallback.`);
  }
}

for (const guest of guests) {
  const file = `guests/${guest.id}/index.html`;
  const html = read(file);
  if (!html) continue;
  if (!html.includes('data-static-crawl-fallback="guest"')) {
    errors.push(`${file} must include a crawler-visible static guest fallback.`);
  }
  if (html.includes('<div id="app"></div>')) {
    errors.push(`${file} must not ship as an empty JavaScript-only app shell.`);
  }
  if (!html.includes('id="detail-structured-data"')) {
    errors.push(`${file} must ship static guest entity structured data before JavaScript runs.`);
  }
  if (!html.includes('"@type":"Person"') || !html.includes('"subjectOf"')) {
    errors.push(`${file} must connect the guest Person entity to verified related episode pages.`);
  }
  if (!html.includes('property="og:image:alt"') || !html.includes('name="twitter:image:alt"')) {
    errors.push(`${file} must include accessible social-image alt metadata.`);
  }
  for (const episodeId of guest.episodeIds || []) {
    if (!html.includes(`href="/episodes/${episodeId}"`)) {
      errors.push(`${file} must expose a direct crawlable link to episode ${episodeId}.`);
    }
    const episode = episodes.find(item => item.id === episodeId);
    if (episode && !html.includes(`<a href="/episodes/${episodeId}">${escapeHtml(episode.title)}</a>`)) {
      errors.push(`${file} must use the canonical editorial title for episode ${episodeId}.`);
    }
  }
}

if (errors.length) {
  console.error(`\nStatic crawl gate failed with ${errors.length} issue${errors.length === 1 ? "" : "s"}:\n`);
  errors.forEach(error => console.error(`  - ${error}`));
  process.exit(1);
}

console.log("Static archive crawl gate passed.");
console.log(`  Episode pages with crawler-visible fallbacks + static VideoObject: ${episodes.length}`);
console.log(`  Guest pages with crawler-visible fallbacks + Person entity links: ${guests.length}`);
