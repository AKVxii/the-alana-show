import fs from "node:fs";

const errors = [];
const read = file => {
  if (!fs.existsSync(file)) {
    errors.push(`Missing required file: ${file}`);
    return "";
  }
  return fs.readFileSync(file, "utf8");
};

const enhancements = read("src/data/episode-enhancements.js");
const editorial = read("src/lib/episode-editorial.js");
const mediaHeader = read("src/components/MediaHeader.js");
const georgePage = read("episodes/george-lemieux/index.html");
const packageJson = read("package.json");

for (const needle of [
  '"george-lemieux"',
  'startSeconds: 0, endSeconds: 73',
  'startSeconds: 1799, endSeconds: 1881',
  'America’s Debt and Fiscal Discipline',
  'Why Character Is Everything'
]) {
  if (!enhancements.includes(needle)) errors.push(`Verified episode enhancement is missing: ${needle}`);
}

const chapterRecords = (enhancements.match(/startSeconds:/g) || []).length;
if (chapterRecords !== 13) errors.push(`Expected 13 verified George LeMieux chapters, found ${chapterRecords}.`);

for (const needle of [
  '"@type": "Clip"',
  'data-track-event="Episode Chapter"',
  'data-track-exclusive="true"',
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

for (const needle of [
  'max-video-preview:-1',
  'youtube-nocookie.com/embed/Kx7rcDzaqDk?rel=0',
  'data-static-episode-chapters',
  'data-static-episode-highlights',
  '"@type":"Clip"',
  'https://thealanashow.com/episodes/george-lemieux?t=1351'
]) {
  if (!georgePage.includes(needle)) errors.push(`Static George LeMieux watch page is missing: ${needle}`);
}

const staticChapterLinks = (georgePage.match(/class="episode-chapter-link"/g) || []).length;
if (staticChapterLinks !== 13) errors.push(`Expected 13 static chapter links, found ${staticChapterLinks}.`);

if (!packageJson.includes("episode-editorial-gate.mjs")) {
  errors.push("Episode editorial regression gate must run in npm run quality.");
}

if (errors.length) {
  console.error(`Episode editorial gate failed with ${errors.length} issue${errors.length === 1 ? "" : "s"}:`);
  errors.forEach(error => console.error(`  - ${error}`));
  process.exit(1);
}

console.log("Episode editorial gate passed.");
console.log("  George LeMieux key moments, Clip markup, static player and measurement: OK");
