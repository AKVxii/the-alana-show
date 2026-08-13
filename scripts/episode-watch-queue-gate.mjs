import fs from "node:fs";

const source = fs.readFileSync("src/detail-page.js", "utf8");
const errors = [];
const fail = message => errors.push(message);

for (const required of [
  "episodes as editorialEpisodes",
  "function episodeQueueVideoIds(episode)",
  "candidate.videoId !== episode.videoId",
  "playlist=${queueParam}",
  "youtube-nocookie.com/embed/"
]) if (!source.includes(required)) fail(`Episode player is missing queue behavior: ${required}`);

if (/autoplay=1/.test(source)) fail("Episode queue must not autoplay when a visitor lands on the page.");

const packageJson = JSON.parse(fs.readFileSync("package.json", "utf8"));
if (!String(packageJson.scripts?.quality || "").includes("episode-watch-queue-gate.mjs")) fail("Episode watch queue gate is not included in npm run quality.");

if (errors.length) {
  console.error(`Episode watch queue gate failed with ${errors.length} issue${errors.length === 1 ? "" : "s"}:`);
  errors.forEach(error => console.error(`  - ${error}`));
  process.exit(1);
}

console.log("Episode watch queue gate passed.");
