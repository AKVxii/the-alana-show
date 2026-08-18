import fs from "node:fs";

const source = fs.readFileSync("src/detail-page.js", "utf8");
const errors = [];
const fail = message => errors.push(message);

for (const required of [
  "youtube-nocookie.com/embed/${encodeURIComponent(episode.videoId)}?rel=0${startParam}",
  "https://www.youtube.com/watch?v=${encodeURIComponent(episode.videoId)}",
  "const startSeconds = requestedStartSeconds();",
  "const startParam = startSeconds ? `&start=${startSeconds}` : \"\";"
]) if (!source.includes(required)) fail(`Episode player is missing exact-master behavior: ${required}`);

for (const forbidden of [
  "episodeQueueVideoIds",
  "queueVideoIds",
  "queueParam",
  "&playlist=",
  "playlist=${"
]) if (source.includes(forbidden)) fail(`Canonical episode embeds must not include cross-episode queue behavior: ${forbidden}`);

if (/autoplay=1/.test(source)) fail("Episode player must not autoplay when a visitor lands on the page.");

const packageJson = JSON.parse(fs.readFileSync("package.json", "utf8"));
if (!String(packageJson.scripts?.quality || "").includes("episode-watch-queue-gate.mjs")) fail("Episode player integrity gate is not included in npm run quality.");

if (errors.length) {
  console.error(`Episode player integrity gate failed with ${errors.length} issue${errors.length === 1 ? "" : "s"}:`);
  errors.forEach(error => console.error(`  - ${error}`));
  process.exit(1);
}

console.log("Episode player integrity gate passed.");
console.log("  Canonical episode page -> exact verified YouTube master: OK");
console.log("  Cross-episode playlist queue removed: OK");