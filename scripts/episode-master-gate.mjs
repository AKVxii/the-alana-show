import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

const ROOT = process.cwd();
const OLD_ID = "1M6f1v1P6Pw";
const TARGET_SLUG = "scott-diament-gillian-lieberman";
const EXPECTED_ID = "NN9mSARhmIQ";
const EXPECTED_TITLE = "Gillian Lieberman & Scott Diament: Palm Beach Business, Luxury & Leadership";
const EXPECTED_PUBLISHED = "2026-08-06T15:17:25Z";
const EXPECTED_DURATION = 1662;
const errors = [];
const fail = message => errors.push(message);

const catalogUrl = `${pathToFileURL(path.join(ROOT, "src/data/catalog.js")).href}?gate=${Date.now()}`;
const { episodes } = await import(catalogUrl);
const matches = episodes.filter(episode => episode.id === TARGET_SLUG);
if (matches.length !== 1) fail(`Expected exactly one ${TARGET_SLUG} episode record, found ${matches.length}.`);
const episode = matches[0];
if (episode) {
  if (episode.videoId !== EXPECTED_ID) fail(`Catalog videoId must be ${EXPECTED_ID}.`);
  if (episode.title !== EXPECTED_TITLE) fail("Catalog title does not match the approved canonical title.");
  if (episode.canonical?.title !== EXPECTED_TITLE) fail("Canonical title override is missing or incorrect.");
  if (episode.canonical?.publishedAt !== EXPECTED_PUBLISHED) fail("Original August 6 publication timestamp must remain preserved.");
  if (Number(episode.canonical?.durationSeconds) !== EXPECTED_DURATION) fail("Canonical duration must remain 1662 seconds (27:42).");
  if (!String(episode.canonical?.thumbnail || "").includes(`/vi/${EXPECTED_ID}/`)) fail("Canonical thumbnail must reference the final master thumbnail.");
}
if (episodes.filter(episode => episode.videoId === EXPECTED_ID).length !== 1) fail("Final master YouTube ID must belong to exactly one verified episode.");

const pagePath = path.join(ROOT, "episodes", TARGET_SLUG, "index.html");
const page = fs.readFileSync(pagePath, "utf8");
for (const required of [
  EXPECTED_ID,
  EXPECTED_TITLE,
  "27:42",
  "August 6, 2026",
  `https://www.youtube-nocookie.com/embed/${EXPECTED_ID}`,
  `https://www.youtube.com/watch?v=${EXPECTED_ID}`,
  "PT27M42S"
]) if (!page.includes(required)) fail(`Permanent episode page is missing required value: ${required}`);
if (page.includes(OLD_ID)) fail("Permanent episode page still references the private former master.");

const videoSitemap = fs.readFileSync(path.join(ROOT, "video-sitemap.xml"), "utf8");
const targetStart = videoSitemap.indexOf(`<loc>https://thealanashow.com/episodes/${TARGET_SLUG}</loc>`);
if (targetStart < 0) fail("Video sitemap is missing the canonical episode URL.");
else {
  const targetEnd = videoSitemap.indexOf("</url>", targetStart);
  const entry = videoSitemap.slice(targetStart, targetEnd > targetStart ? targetEnd : undefined);
  if (!entry.includes(EXPECTED_ID)) fail("Video sitemap target entry does not reference the final master.");
  if (!entry.includes("<video:duration>1662</video:duration>")) fail("Video sitemap target entry does not carry the final duration.");
  if (!entry.includes(`<video:publication_date>${EXPECTED_PUBLISHED}</video:publication_date>`)) fail("Video sitemap target entry does not preserve the original publication timestamp.");
  if (entry.includes(OLD_ID)) fail("Video sitemap target entry still references the private former master.");
}

const hub = fs.readFileSync(path.join(ROOT, "episodes", "index.html"), "utf8");
if (!hub.includes(EXPECTED_TITLE)) fail("Episode archive static metadata is not synchronized to the canonical title.");

const textExtensions = new Set([".js", ".mjs", ".html", ".json", ".xml", ".md", ".txt", ".yml", ".yaml"]);
const ignored = new Set([".git", "node_modules"]);
const ignoredFiles = new Set([
  "scripts/episode-master-gate.mjs",
  ".github/workflows/gillian-scott-master-once.yml"
]);
function scan(directory) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    if (ignored.has(entry.name)) continue;
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) { scan(absolute); continue; }
    if (!textExtensions.has(path.extname(entry.name))) continue;
    const relative = path.relative(ROOT, absolute).replace(/\\/g, "/");
    if (ignoredFiles.has(relative)) continue;
    const text = fs.readFileSync(absolute, "utf8");
    if (text.includes(OLD_ID)) fail(`Former private master ID remains in ${relative}.`);
  }
}
scan(ROOT);

if (errors.length) {
  console.error(`Episode master gate failed with ${errors.length} issue${errors.length === 1 ? "" : "s"}:`);
  errors.forEach(error => console.error(`  - ${error}`));
  process.exit(1);
}
console.log("Episode master gate passed.");
console.log(`  ${TARGET_SLUG}: ${EXPECTED_ID} · 27:42 · original publication date preserved`);
