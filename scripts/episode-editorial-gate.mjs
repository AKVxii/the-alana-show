import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

const ROOT = process.cwd();
const errors = [];
const fail = message => errors.push(message);
const read = relative => {
  const file = path.join(ROOT, relative);
  if (!fs.existsSync(file)) {
    fail(`Missing required file: ${relative}`);
    return "";
  }
  return fs.readFileSync(file, "utf8");
};

const catalogSource = read("src/data/catalog.js");
const publisherSource = read("scripts/publish-conversation.mjs");
const thumbnailSource = read("src/components/Episodes.js");
const styles = read("src/styles.css");
const { episodes, guests } = await import(`${pathToFileURL(path.join(ROOT, "src/data/catalog.js")).href}?gate=${Date.now()}`);

if (!catalogSource.includes("const episodeRecords = [")) fail("Catalog identity records must remain separate from the mapped editorial export.");
if (!catalogSource.includes("export const episodes = episodeRecords")) fail("Catalog must export mapped and sorted editorial episodes.");
if (episodes.length < 25) fail(`Editorial catalog unexpectedly contains only ${episodes.length} episodes.`);

const episodeIds = new Set();
const videoIds = new Set();
for (const episode of episodes) {
  if (episodeIds.has(episode.id)) fail(`Duplicate episode slug: ${episode.id}`);
  if (videoIds.has(episode.videoId)) fail(`Duplicate YouTube master: ${episode.videoId}`);
  episodeIds.add(episode.id);
  videoIds.add(episode.videoId);

  if (!/^[A-Za-z0-9_-]{11}$/.test(episode.videoId || "")) fail(`${episode.id}: invalid YouTube master ID.`);
  if (episode.detailPath !== `/episodes/${episode.id}/`) fail(`${episode.id}: permanent detail path is not canonical.`);
  if (/^Conversation with\b/i.test(episode.title || "")) fail(`${episode.id}: generic fallback title escaped into the editorial catalog.`);
  if (episode.title !== episode.canonical?.title) fail(`${episode.id}: exported title does not match the canonical editorial title.`);
  if (!String(episode.canonical?.deck || "").trim()) fail(`${episode.id}: canonical one-sentence deck is missing.`);
  if (!String(episode.canonical?.description || "").trim()) fail(`${episode.id}: verified episode overview is missing.`);
  if (!episode.canonical?.publishedAt || Number.isNaN(Date.parse(episode.canonical.publishedAt))) fail(`${episode.id}: verified publication timestamp is missing or invalid.`);
  if (!Number.isFinite(episode.canonical?.durationSeconds) || episode.canonical.durationSeconds <= 0) fail(`${episode.id}: verified duration is missing or invalid.`);
  if (!String(episode.canonical?.thumbnail || "").includes(`/vi/${episode.videoId}/`)) fail(`${episode.id}: thumbnail does not belong to its exact YouTube master.`);
  if (!Array.isArray(episode.canonical?.categories) || !episode.canonical.categories.length) fail(`${episode.id}: at least one verified editorial topic is required.`);
  if (episode.guestNames?.length !== episode.guestIds?.length) fail(`${episode.id}: verified guest names and guest IDs are out of sync.`);
}

for (let index = 1; index < episodes.length; index += 1) {
  if (Date.parse(episodes[index - 1].publishedAt) < Date.parse(episodes[index].publishedAt)) {
    fail("Editorial episodes must remain sorted newest-first after mapping.");
    break;
  }
}

for (const guest of guests) {
  for (const episodeId of guest.episodeIds || []) {
    if (!episodeIds.has(episodeId)) fail(`${guest.id}: references missing episode ${episodeId}.`);
  }
}

for (const required of [
  'arrayBounds(catalog, "episodeRecords")',
  'appendArrayRecord(catalog, "episodeRecords", episodeRecord)',
  "const canonicalRecord = { title, deck, description, publishedAt, durationSeconds, thumbnail }",
  "generic conversation titles are not generated",
  "unverifiedEditorialCopyIssue({ description: explicitDescription, deck: explicitDeck })",
  '"scripts/sync-episode-editorial.mjs"'
]) if (!publisherSource.includes(required)) fail(`Future publishing is not synchronized with the editorial catalog: ${required}`);

if (!thumbnailSource.includes('class="thumbnail-brand"')) fail("Exact YouTube thumbnails are missing the subtle show brand mark.");
if (!thumbnailSource.includes("data-thumbnail-retry-src")) fail("Thumbnail delivery is missing its reliable YouTube retry source.");
if (!styles.includes(".thumbnail-brand")) fail("Thumbnail brand mark styling is missing.");
if (/filter:\s*contrast/i.test(styles)) fail("Exact guest thumbnails must not receive a contrast filter.");

const enhancements = read("src/data/episode-enhancements.js");
const editorial = read("src/lib/episode-editorial.js");
const mediaHeader = read("src/components/MediaHeader.js");
const newsletter = read("src/newsletter.js");
const newsletterStyles = read("src/newsletter.css");
const georgePage = read("episodes/george-lemieux/index.html");
const packageJson = read("package.json");

for (const needle of [
  '"george-lemieux"',
  'startSeconds: 0, endSeconds: 73',
  'startSeconds: 1799, endSeconds: 1881',
  'America’s Debt and Fiscal Discipline',
  'Why Character Is Everything',
  'What first drew George LeMieux to public service?',
  'What warning does he give about federal debt?',
  'id: "ric-bradshaw"',
  'id: "stacey-ibarra-vaughn-mitchell"',
  'id: "celeste-ellich-bob-sutton"'
]) {
  if (!enhancements.includes(needle)) errors.push(`Verified episode enhancement is missing: ${needle}`);
}

const chapterBlock = enhancements.match(/chapters:\s*\[([\s\S]*?)\]\s*,\s*guide:/)?.[1] || "";
const guideBlock = enhancements.match(/guide:\s*\[([\s\S]*?)\]\s*,\s*related:/)?.[1] || "";
const chapterRecords = (chapterBlock.match(/startSeconds:/g) || []).length;
const guideRecords = (guideBlock.match(/question:/g) || []).length;
if (chapterRecords !== 13) errors.push(`Expected 13 verified George LeMieux chapters, found ${chapterRecords}.`);
if (guideRecords !== 7) errors.push(`Expected 7 transcript-grounded episode-guide entries, found ${guideRecords}.`);

for (const needle of [
  '"@type": "Clip"',
  'data-track-event="Episode Chapter"',
  'data-track-event="Episode Guide"',
  'data-track-event="Related Conversation"',
  'data-episode-guide',
  'data-episode-related',
  'data-episode-editorial-related',
  'data-episode-newsletter',
  'Newsletter({ compact: true })',
  'setupNewsletter(newsletterNode)',
  'existingRelated.outerHTML = curatedRelated',
  'delete video.potentialAction',
  'MutationObserver'
]) {
  if (!editorial.includes(needle)) errors.push(`Episode editorial runtime is missing: ${needle}`);
}

if (!mediaHeader.includes('import { setupEpisodeEditorial } from "../lib/episode-editorial.js";')) {
  errors.push("Media pages must import episode editorial enhancements.");
}
if (!mediaHeader.includes("setupEpisodeEditorial();")) {
  errors.push("Media navigation setup must activate episode editorial enhancements.");
}
if (!mediaHeader.includes('/src/newsletter.css?v=2')) {
  errors.push("Media pages must load the reusable newsletter stylesheet.");
}

for (const needle of [
  'Newsletter({ compact = false } = {})',
  'newsletter-section-compact'
]) {
  if (!newsletter.includes(needle) && !newsletterStyles.includes(needle)) {
    errors.push(`Reusable newsletter support is missing: ${needle}`);
  }
}

for (const needle of [
  'max-video-preview:-1',
  'youtube-nocookie.com/embed/Kx7rcDzaqDk?rel=0',
  'data-static-episode-chapters',
  'data-static-episode-highlights',
  'data-static-episode-guide',
  'data-static-episode-related',
  '"@type":"Clip"',
  '"dateModified":"2026-08-20"',
  'https://thealanashow.com/episodes/george-lemieux?t=1351',
  '/episodes/ric-bradshaw',
  '/episodes/stacey-ibarra-vaughn-mitchell',
  '/episodes/celeste-ellich-bob-sutton'
]) {
  if (!georgePage.includes(needle)) errors.push(`Static George LeMieux watch page is missing: ${needle}`);
}

const staticChapterLinks = (georgePage.match(/class="episode-chapter-link"/g) || []).length;
const staticGuideEntries = (georgePage.match(/class="episode-guide-item"/g) || []).length;
if (staticChapterLinks !== 13) errors.push(`Expected 13 static chapter links, found ${staticChapterLinks}.`);
if (staticGuideEntries !== 7) errors.push(`Expected 7 static episode-guide entries, found ${staticGuideEntries}.`);

if (!packageJson.includes("episode-editorial-gate.mjs")) {
  errors.push("Episode editorial regression gate must run in npm run quality.");
}

if (errors.length) {
  console.error(`Episode editorial gate failed with ${errors.length} issue${errors.length === 1 ? "" : "s"}:`);
  errors.forEach(error => console.error(`  - ${error}`));
  process.exit(1);
}

console.log("Episode editorial gate passed.");
console.log(`  ${episodes.length} canonical conversations: unique, complete and newest-first`);
console.log("  Premium titles, decks, exact guest thumbnails and future publishing: PROTECTED");
console.log("  George LeMieux key moments, episode guide, watch-next path, newsletter and measurement: OK");
