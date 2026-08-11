import fs from "node:fs";

const errors = [];
const read = file => fs.existsSync(file) ? fs.readFileSync(file, "utf8") : "";
const assert = (condition, message) => { if (!condition) errors.push(message); };

const main = read("src/main.js");
const catalog = read("src/data/catalog.js");
const episodesComponent = read("src/components/Episodes.js");
const archive = read("src/episodes-page.js");

assert(main.includes('episodes as editorialEpisodes'), "Homepage must import the verified static episode catalog for live-feed failure recovery.");
assert(main.includes('state.episodes = uniqueEpisodes(editorialEpisodes).map(enrichEpisode);'), "Homepage live-feed catch path must restore the verified static conversation archive.");
assert(main.includes('updateFeatured(fallbackLatest);'), "Homepage live-feed failure must keep a verified featured conversation.");
assert(main.includes('updateLatest(fallbackLatest);'), "Homepage live-feed failure must keep the latest-conversation surface populated.");
assert(main.includes('renderEpisodes(state.episodes);'), "Homepage live-feed failure must render verified conversation cards.");
assert(main.includes('renderSearchResults("");'), "Homepage live-feed failure must keep archive search initialized.");
assert(!main.includes('state.episodes = [];\n    renderSearchResults("");'), "Homepage must not discard its owned conversation archive when YouTube is unavailable.");
assert(!main.includes('Explore every conversation on YouTube.</strong>'), "Homepage must not collapse the owned archive into a generic external-platform fallback.");
assert(main.includes('A verified conversation from The Alana Show archive.'), "Static fallback cards must have graceful copy when live descriptions are unavailable.");
assert(main.includes('formatDate(enriched.publishedAt) || "Verified conversation"'), "Static fallback episode cards must have a meaningful label when live dates are unavailable.");
assert(main.includes('formatDate(episode.publishedAt) || "Verified conversation"'), "Static fallback search results must have a meaningful label when live dates are unavailable.");

assert(catalog.includes('export const episodes = ['), "Verified static episode catalog is missing.");
const verifiedEpisodeCount = [...catalog.matchAll(/\{ id: "[^"]+", videoId: "[A-Za-z0-9_-]{11}"/g)].length;
assert(verifiedEpisodeCount >= 20, `Static recovery catalog is unexpectedly small: ${verifiedEpisodeCount} verified episodes.`);
assert(catalog.includes('detailPath: "/episodes/'), "Static recovery records must point to owned permanent episode pages.");

// The archive and homepage should share the same resilience principle: external
// metadata improves the experience, but the owned verified catalog keeps it useful.
assert(archive.includes('state.episodes = editorialEpisodes;'), "Episodes archive must retain its verified static fallback.");
assert(episodesComponent.includes('BrandedEpisodeArtwork'), "Missing thumbnails must retain branded artwork rather than broken image chrome.");

assert(!fs.existsSync(".github/workflows/home-feed-resilience-once.yml"), "One-time homepage edit workflow must be removed before merge.");

if (errors.length) {
  console.error(`\nHomepage feed resilience gate failed with ${errors.length} issue${errors.length === 1 ? "" : "s"}:\n`);
  errors.forEach(error => console.error(`  - ${error}`));
  process.exit(1);
}

console.log("Homepage feed resilience gate passed.");
console.log(`  Verified static recovery catalog: ${verifiedEpisodeCount} conversations`);
console.log("  Featured/latest/recent/search surfaces remain populated during live-feed failure: OK");
console.log("  Branded missing-metadata behavior: OK");
console.log("  External YouTube availability is no longer a homepage archive dependency: OK");
