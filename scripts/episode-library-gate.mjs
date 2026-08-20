import fs from "node:fs";

const source = fs.readFileSync("src/episodes-page.js", "utf8");
const card = fs.readFileSync("src/lib/media-page.js", "utf8");
const styles = fs.readFileSync("src/flagship-polish.css", "utf8");
const hero = fs.readFileSync("src/components/Hero.js", "utf8");
const errors = [];
const requireText = (content, value, message) => { if (!content.includes(value)) errors.push(message); };

for (const [value, message] of [
  ["the-alana-show:saved-conversations:v1", "Saved conversations must use the stable device-local storage key."],
  ["data-saved-filter", "The archive is missing its saved-conversation filter."],
  ["data-topic-chip", "The archive is missing its topic shortcuts."],
  ["data-sort", "The archive is missing its conversation sorting control."],
  ["sort === \"longest\"", "The archive is missing duration sorting."],
  ["persistSavedEpisodes", "Saved conversations are not persisted on the visitor's device."],
  ["state.savedOnly", "The archive is missing its saved-only state."],
  ["trackEvent(\"Conversation Save\"", "Saved-conversation interactions are not measured with the privacy-safe event layer."]
]) requireText(source, value, message);

requireText(card, "{ savable = false }", "Shared episode cards must keep saving opt-in so other hubs are unchanged.");
requireText(card, "data-save-episode", "Savable cards are missing their stable episode identifier.");
requireText(card, "data-episode-primary-link", "Archive cards must expose one primary conversation destination.");
requireText(source, 'render({ focusTarget: "saved-card", focusIndex })', "Removing a saved-only card must move focus to the next predictable archive control.");
requireText(source, 'render({ focusTarget: "first-card" })', "Explore-all must move focus to the first restored conversation.");
requireText(styles, ".flagship-archive-controls :focus-visible", "Archive controls need an explicit high-contrast focus treatment.");
requireText(styles, ".flagship-library-grid", "The flagship library visual layer is missing.");
requireText(styles, "prefers-reduced-motion", "The flagship library must respect reduced-motion preferences.");

for (const quote of [
  "Real conversations. <em>Distinct voices.</em> Thoughtful perspective.",
  "Voice of the Gold Coast",
  "Hosted by"
]) requireText(hero.toLowerCase(), quote.toLowerCase(), `Approved hero wording changed or disappeared: ${quote}`);

if (errors.length) {
  console.error(`Episode library gate failed with ${errors.length} issue${errors.length === 1 ? "" : "s"}:`);
  errors.forEach(error => console.error(`  - ${error}`));
  process.exit(1);
}

console.log("Episode library gate passed.");
console.log("  Search, topic shortcuts, sorting and device-local saved conversations: OK");
console.log("  Approved homepage wording and reduced-motion support: PRESERVED");
