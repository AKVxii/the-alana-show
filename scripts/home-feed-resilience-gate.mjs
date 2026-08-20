import fs from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { pathToFileURL } from "node:url";

const require = createRequire(import.meta.url);
const errors = [];
const read = file => fs.existsSync(file) ? fs.readFileSync(file, "utf8") : "";
const assert = (condition, message) => { if (!condition) errors.push(message); };

const main = read("src/main.js");
const catalog = read("src/data/catalog.js");
const episodesComponent = read("src/components/Episodes.js");
const archive = read("src/episodes-page.js");
const youtubeApiSource = read("api/youtube.js");
const youtubeApi = require("../api/youtube.js");
const { episodes: verifiedEpisodes } = await import(`${pathToFileURL(path.resolve("src/data/catalog.js")).href}?gate=${Date.now()}`);

assert(main.includes('episodes as editorialEpisodes'), "Homepage must import the verified static episode catalog for live-feed failure recovery.");
assert(main.includes('state.episodes = mergeEpisodeSources(editorialEpisodes).map(enrichEpisode);'), "Homepage live-feed catch path must restore the verified static conversation archive.");
assert(main.includes('mergeEpisodeSources(liveEpisodes, editorialEpisodes)'), "Homepage partial live-feed success must retain every verified canonical conversation.");
assert(main.includes('const FEATURED_CONVERSATION_VIDEO_ID = "Kx7rcDzaqDk";'), "Homepage must pin the approved George LeMieux episode as its featured conversation.");
assert(main.includes('updateFeatured(fallbackFeatured);'), "Homepage live-feed failure must keep the approved featured conversation.");
assert(main.includes('updateLatest(fallbackLatest);'), "Homepage live-feed failure must keep the latest-conversation surface populated.");
assert(main.includes('renderEpisodes(state.episodes);'), "Homepage live-feed failure must render verified conversation cards.");
assert(main.includes('renderSearchResults("");'), "Homepage live-feed failure must keep archive search initialized.");
assert(!main.includes('state.episodes = [];\n    renderSearchResults("");'), "Homepage must not discard its owned conversation archive when YouTube is unavailable.");
assert(!main.includes('Explore every conversation on YouTube.</strong>'), "Homepage must not collapse the owned archive into a generic external-platform fallback.");
assert(main.includes('A verified conversation from The Alana Show archive.'), "Static fallback cards must have graceful copy when live descriptions are unavailable.");
assert(main.includes('formatDate(enriched.publishedAt) || "Verified conversation"'), "Static fallback episode cards must have a meaningful label when live dates are unavailable.");
assert(main.includes('formatDate(episode.publishedAt) || "Verified conversation"'), "Static fallback search results must have a meaningful label when live dates are unavailable.");

assert(catalog.includes('const episodeRecords = ['), "Verified static episode identity records are missing.");
assert(catalog.includes('export const episodes = episodeRecords'), "Mapped editorial episode export is missing.");
const verifiedEpisodeCount = verifiedEpisodes.length;
assert(verifiedEpisodeCount >= 20, `Static recovery catalog is unexpectedly small: ${verifiedEpisodeCount} verified episodes.`);
assert(verifiedEpisodes.every(episode => String(episode.detailPath || "").startsWith("/episodes/")), "Static recovery records must point to owned permanent episode pages.");
assert(verifiedEpisodes.every(episode => episode.canonical?.deck), "Static recovery records must carry a verified editorial deck.");

// Replacement uploads may coexist in YouTube's uploads feed briefly. The
// newest master with the same normalized conversation title must win so a
// replaced/private upload cannot create a duplicate homepage card.
const collapseReplacementMasters = youtubeApi?._test?.collapseReplacementMasters;
assert(typeof collapseReplacementMasters === "function", "YouTube feed must expose replacement-master dedupe for regression testing.");
if (typeof collapseReplacementMasters === "function") {
  const replacementFixture = [
    { videoId: "Kx7rcDzaqDk", title: "Former U.S. Senator George LeMieux | Leadership, Public Service & Florida’s Future", publishedAt: "2026-08-19T16:12:15Z" },
    { videoId: "VYXrV-WGiHM", title: "Former U.S. Senator George LeMieux | Leadership, Public Service & Florida’s Future | The Alana Show", publishedAt: "2026-08-06T14:23:31Z" },
    { videoId: "NN9mSARhmIQ", title: "Gillian Lieberman & Scott Diament: Palm Beach Business, Luxury & Leadership | The Alana Show", publishedAt: "2026-08-12T17:34:00Z" }
  ];
  const collapsed = collapseReplacementMasters(replacementFixture);
  assert(collapsed.length === 2, `Replacement-master collapse should keep 2 canonical conversations, got ${collapsed.length}.`);
  assert(collapsed[0]?.videoId === "Kx7rcDzaqDk", "Newest George LeMieux master must win replacement dedupe.");
  assert(!collapsed.some(video => video.videoId === "VYXrV-WGiHM"), "Superseded George LeMieux master must not survive live-feed dedupe.");
}

// The archive and homepage should share the same resilience principle: external
// metadata improves the experience, but the owned verified catalog keeps it useful.
assert(archive.includes('state.episodes = editorialEpisodes;'), "Episodes archive must retain its verified static fallback.");
assert(archive.includes('mergeEpisodeSources(liveEpisodes, editorialEpisodes)'), "Episodes archive partial live-feed success must retain every verified canonical conversation.");
assert(archive.includes('FEATURED_CONVERSATION_VIDEO_ID = "Kx7rcDzaqDk"'), "Episodes archive must use the approved George LeMieux episode as its featured conversation.");
assert(archive.includes('episode.detailPath || `https://www.youtube.com/watch?v=${episode.videoId}`'), "Episodes archive featured CTA must prefer the permanent owned episode page.");
assert(youtubeApiSource.includes('FEATURED_CONVERSATION_VIDEO_ID = "Kx7rcDzaqDk"'), "Live YouTube data must use the approved George LeMieux episode as its featured conversation.");
assert(episodesComponent.includes('Kx7rcDzaqDk') && episodesComponent.includes('Former U.S. Senator George LeMieux'), "Homepage server-rendered featured content must match the approved George LeMieux episode.");
assert(episodesComponent.includes('data-thumbnail-retry-src') && episodesComponent.includes('hqdefault'), "Episode thumbnails must remain available when the live feed or maximum-resolution artwork is unavailable.");
assert(episodesComponent.includes('BrandedEpisodeArtwork'), "Missing thumbnails must retain branded artwork rather than broken image chrome.");
assert(episodesComponent.includes('thumbnail-brand'), "Exact YouTube thumbnails must retain the subtle Alana Show brand mark.");

assert(!fs.existsSync(".github/workflows/home-feed-resilience-once.yml"), "One-time homepage edit workflow must be removed before merge.");

if (errors.length) {
  console.error(`\nHomepage feed resilience gate failed with ${errors.length} issue${errors.length === 1 ? "" : "s"}:\n`);
  errors.forEach(error => console.error(`  - ${error}`));
  process.exit(1);
}

console.log("Homepage feed resilience gate passed.");
console.log(`  Verified static recovery catalog: ${verifiedEpisodeCount} conversations`);
console.log("  Replacement YouTube masters collapse to the newest conversation: OK");
console.log("  Featured/latest/recent/search surfaces remain populated during live-feed failure: OK");
console.log("  Branded missing-metadata behavior: OK");
console.log("  External YouTube availability is no longer a homepage archive dependency: OK");
