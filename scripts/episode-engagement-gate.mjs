import fs from "node:fs";

const errors = [];
const read = file => {
  if (!fs.existsSync(file)) {
    errors.push(`Missing required file: ${file}`);
    return "";
  }
  return fs.readFileSync(file, "utf8");
};

const engagement = read("src/lib/episode-engagement.js");
const mediaHeader = read("src/components/MediaHeader.js");
const packageJson = read("package.json");

for (const needle of [
  'MILESTONES_SECONDS = [30, 120]',
  'document.visibilityState',
  'trackEvent("Episode Engaged"',
  'episode,',
  'milestone: `${milestone}s`',
  'window.addEventListener("pagehide"'
]) {
  if (!engagement.includes(needle)) errors.push(`Episode engagement measurement is missing: ${needle}`);
}

if (!mediaHeader.includes('import("../lib/episode-engagement.js")')) {
  errors.push("Episode detail pages must lazy-load engagement measurement.");
}
if (!mediaHeader.includes("setupEpisodeEngagement();")) {
  errors.push("Media navigation setup must activate episode engagement measurement.");
}
if (!mediaHeader.includes('document.body.dataset.detailType !== "episode"')) {
  errors.push("Ordinary media pages must not load episode-only engagement code.");
}
if (!packageJson.includes("episode-engagement-gate.mjs")) {
  errors.push("Episode engagement regression gate must run in npm run quality.");
}

if (errors.length) {
  console.error(`Episode engagement gate failed with ${errors.length} issue${errors.length === 1 ? "" : "s"}:`);
  errors.forEach(error => console.error(`  - ${error}`));
  process.exit(1);
}

console.log("Episode engagement gate passed.");
console.log("  Privacy-safe visible-time milestones at 30s and 120s: OK");
