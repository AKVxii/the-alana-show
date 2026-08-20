import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

const ROOT = process.cwd();
const errors = [];
const fail = message => errors.push(message);
const read = relative => fs.readFileSync(path.join(ROOT, relative), "utf8");

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

if (errors.length) {
  console.error(`Episode editorial gate failed with ${errors.length} issue${errors.length === 1 ? "" : "s"}:`);
  errors.forEach(error => console.error(`  - ${error}`));
  process.exit(1);
}

console.log("Episode editorial gate passed.");
console.log(`  ${episodes.length} canonical conversations: unique, complete and newest-first`);
console.log("  Premium titles, decks, exact guest thumbnails and future publishing: PROTECTED");
