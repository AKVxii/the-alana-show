import fs from "node:fs";

const source = fs.readFileSync("scripts/sync-episode-master.mjs", "utf8");
const errors = [];
const fail = message => errors.push(message);

for (const required of [
  '"scripts/sync-video-sitemap.mjs"',
  '"scripts/sync-sitemap-freshness.mjs"'
]) if (!source.includes(required)) fail(`Episode master sync is missing dependent sitemap refresh: ${required}`);

const packageJson = JSON.parse(fs.readFileSync("package.json", "utf8"));
if (!String(packageJson.scripts?.quality || "").includes("episode-master-sitemap-gate.mjs")) fail("Episode master sitemap regression gate is not included in npm run quality.");

if (errors.length) {
  console.error(`Episode master sitemap gate failed with ${errors.length} issue${errors.length === 1 ? "" : "s"}:`);
  errors.forEach(error => console.error(`  - ${error}`));
  process.exit(1);
}

console.log("Episode master sitemap gate passed.");
