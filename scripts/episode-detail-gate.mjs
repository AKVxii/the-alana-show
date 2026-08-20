import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

const ROOT = process.cwd();
const errors = [];
const fail = message => errors.push(message);
const read = relative => fs.readFileSync(path.join(ROOT, relative), "utf8");
const escapeHtml = value => String(value ?? "").replace(/[&<>"']/g, character => ({
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#039;"
})[character]);

const catalogUrl = `${pathToFileURL(path.join(ROOT, "src/data/catalog.js")).href}?detail-gate=${Date.now()}`;
const profilesUrl = `${pathToFileURL(path.join(ROOT, "src/data/guest-profiles.js")).href}?detail-gate=${Date.now()}`;
const enhancementsUrl = `${pathToFileURL(path.join(ROOT, "src/data/episode-enhancements.js")).href}?detail-gate=${Date.now()}`;
const { episodes, guestById } = await import(catalogUrl);
const { guestProfileById } = await import(profilesUrl);
const { episodeEnhancementById } = await import(enhancementsUrl);
const detail = read("src/detail-page.js");
const share = read("src/lib/share.js");
const styles = read("src/media.css");
const backfill = read("scripts/backfill-static-crawl.mjs");

for (const required of [
  "episodeDisplayData(episode)",
  "episodeOverviewMarkup(episode)",
  "episodeTopicsMarkup(episode)",
  "episodeGuestCredentialsMarkup(episode)",
  "episodeChaptersMarkup(episode)",
  "episodeRelatedMarkup(episode)",
  "verifiedChapters(episode)",
  "episodeVideoObject(episode, data)",
  "videoObject.hasPart = clips",
  "data-episode-primary-actions",
  "episode-guest-profile-name-only",
  'import "./featured-video.js"',
  '<featured-video data-context="episode"'
]) if (!detail.includes(required)) fail(`Dynamic episode detail is missing: ${required}`);

const featuredVideo = read("src/featured-video.js");
for (const required of ["fallback-brand", "Play this conversation", 'this.dataset.context === "episode"']) {
  if (!featuredVideo.includes(required)) fail(`Episode player fallback is missing: ${required}`);
}

if (detail.includes('<div id="episode-summary"></div>') || detail.includes('<div id="episode-topics"></div>')) {
  fail("Canonical overview and topics must render immediately rather than waiting for the YouTube feed.");
}
if (!share.includes('document.querySelector("[data-episode-primary-actions]")')) {
  fail("Conversation share must bind to the dedicated primary episode actions.");
}
for (const required of [
  ".episode-content-grid",
  ".episode-guest-grid",
  ".episode-chapter-list",
  ".episode-related-static"
]) if (!styles.includes(required)) fail(`Premium episode styling is missing: ${required}`);

for (const required of [
  "updateEpisodePageMetadata(original, episode)",
  'replaceStaticFallback(updated, "episode", episodeFallback(episode, updated))',
  "replaceStructuredData(updated, episodeGraph(episode, updated))",
  "episodeGuestCredentials(episode)",
  "episodeChapterSection(episode)",
  "episodeRelatedSection(episode)",
  "data-static-episode-guests",
  "data-static-related-conversations"
]) if (!backfill.includes(required)) fail(`Static episode backfill is missing: ${required}`);

function isoDuration(seconds = 0) {
  const total = Number(seconds || 0);
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const secs = Math.floor(total % 60);
  return `PT${hours ? `${hours}H` : ""}${minutes ? `${minutes}M` : ""}${secs || (!hours && !minutes) ? `${secs}S` : ""}`;
}

let pagesWithRelated = 0;
let verifiedCredentialCards = 0;
let nameOnlyCards = 0;

for (const episode of episodes) {
  const relative = `episodes/${episode.id}/index.html`;
  const html = read(relative);
  const canonical = episode.canonical || {};
  const expectedPageTitle = `${canonical.title} | The Alana Show`;
  const expectedDescription = canonical.deck || canonical.metaDescription;

  if (!html.includes(`<title>${escapeHtml(expectedPageTitle)}</title>`)) fail(`${episode.id}: static title is not canonical editorial copy.`);
  if (!html.includes(`<meta name="description" content="${escapeHtml(expectedDescription)}">`)) fail(`${episode.id}: static description does not use the editorial deck.`);
  if (!html.includes("data-static-episode-overview")) fail(`${episode.id}: static overview is missing.`);
  if (!html.includes(escapeHtml(canonical.deck))) fail(`${episode.id}: editorial overview deck is missing from static HTML.`);
  if (!html.includes("data-static-episode-guests")) fail(`${episode.id}: guest section is missing from static HTML.`);
  if (!html.includes("data-episode-primary-actions")) fail(`${episode.id}: dedicated primary actions are missing from static HTML.`);
  if (html.includes("data-static-related-conversations")) pagesWithRelated += 1;

  for (const guestId of episode.guestIds || []) {
    const guest = guestById(guestId);
    const profile = guestProfileById(guestId);
    if (!guest || !html.includes(`href="/guests/${guestId}"`)) fail(`${episode.id}: guest ${guestId} is not linked.`);
    if (profile?.role && profile?.summary) {
      verifiedCredentialCards += 1;
      if (!html.includes(escapeHtml(profile.role)) || !html.includes(escapeHtml(profile.summary))) {
        fail(`${episode.id}: verified credentials for ${guestId} are incomplete.`);
      }
    } else {
      nameOnlyCards += 1;
      if (!html.includes("episode-guest-profile-name-only")) fail(`${episode.id}: ${guestId} needs a name-only guest card.`);
    }
  }

  if (canonical.categories?.length) {
    if (!html.includes("data-static-episode-topics")) fail(`${episode.id}: canonical topics are missing.`);
    for (const category of canonical.categories) {
      if (!html.includes(`>${escapeHtml(category)}</a>`)) fail(`${episode.id}: topic ${category} is missing.`);
    }
  }

  const scriptMatch = html.match(/<script id="detail-structured-data" type="application\/ld\+json">([\s\S]*?)<\/script>/);
  if (!scriptMatch) {
    fail(`${episode.id}: structured data is missing.`);
    continue;
  }
  const graph = JSON.parse(scriptMatch[1])?.["@graph"] || [];
  const video = graph.find(node => node?.["@type"] === "VideoObject");
  if (!video) {
    fail(`${episode.id}: canonical VideoObject is missing.`);
    continue;
  }
  if (video.name !== canonical.title) fail(`${episode.id}: VideoObject title is not canonical.`);
  if (video.uploadDate !== canonical.publishedAt) fail(`${episode.id}: VideoObject publication date is not canonical.`);
  if (video.duration !== isoDuration(canonical.durationSeconds)) fail(`${episode.id}: VideoObject duration is not canonical.`);
  if (!video.thumbnailUrl?.includes(canonical.thumbnail)) fail(`${episode.id}: VideoObject thumbnail is not canonical.`);

  const enhancement = episodeEnhancementById(episode.id);
  const chapters = enhancement?.chapters?.length
    ? enhancement.chapters
    : (Array.isArray(canonical.chapters) ? canonical.chapters : []);
  if (chapters.length) {
    if (!html.includes("data-static-episode-chapters")) fail(`${episode.id}: verified chapter navigation is missing.`);
    if (!Array.isArray(video.hasPart) || video.hasPart.length !== chapters.length) fail(`${episode.id}: chapter Clip schema is incomplete.`);
  } else if (html.includes("data-static-episode-chapters")) {
    fail(`${episode.id}: chapter UI must remain hidden without verified chapter data.`);
  }
}

if (pagesWithRelated < Math.max(1, episodes.length - 2)) fail(`Only ${pagesWithRelated}/${episodes.length} episode pages expose related conversations.`);

if (errors.length) {
  console.error(`Episode detail gate failed with ${errors.length} issue${errors.length === 1 ? "" : "s"}:`);
  errors.forEach(error => console.error(`  - ${error}`));
  process.exit(1);
}

console.log("Episode detail gate passed.");
console.log(`  ${episodes.length} resilient premium episode pages`);
console.log(`  ${verifiedCredentialCards} verified credential cards · ${nameOnlyCards} name-only guest cards`);
console.log(`  ${pagesWithRelated} pages with curated related-conversation discovery`);
