import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

const ROOT = process.cwd();
const catalogUrl = pathToFileURL(path.join(ROOT, "src/data/catalog.js")).href;
const { episodes, guests } = await import(catalogUrl);
const errors = [];

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
  for (const episodeId of guest.episodeIds || []) {
    if (!html.includes(`href="/episodes/${episodeId}"`)) {
      errors.push(`${file} must expose a direct crawlable link to episode ${episodeId}.`);
    }
  }
}

if (errors.length) {
  console.error(`\nStatic crawl gate failed with ${errors.length} issue${errors.length === 1 ? "" : "s"}:\n`);
  errors.forEach(error => console.error(`  - ${error}`));
  process.exit(1);
}

console.log("Static archive crawl gate passed.");
console.log(`  Episode pages with crawler-visible fallbacks: ${episodes.length}`);
console.log(`  Guest pages with crawler-visible fallbacks: ${guests.length}`);
