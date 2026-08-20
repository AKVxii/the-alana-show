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
const newsletter = read("src/newsletter.js");
const newsletterStyles = read("src/newsletter.css");
const georgePage = read("episodes/george-lemieux/index.html");
const packageJson = read("package.json");

for (const needle of [
  '"george-lemieux"',
  'startSeconds: 0, endSeconds: 73',
  'startSeconds: 1799, endSeconds: 1881',
  'America’s Debt and Fiscal Discipline',
  'Why Character Is Everything',
  'What first drew George LeMieux to public service?',
  'What warning does he give about federal debt?',
  'id: "ric-bradshaw"',
  'id: "stacey-ibarra-vaughn-mitchell"',
  'id: "celeste-ellich-bob-sutton"'
]) {
  if (!enhancements.includes(needle)) errors.push(`Verified episode enhancement is missing: ${needle}`);
}

const chapterBlock = enhancements.match(/chapters:\s*\[([\s\S]*?)\]\s*,\s*guide:/)?.[1] || "";
const guideBlock = enhancements.match(/guide:\s*\[([\s\S]*?)\]\s*,\s*related:/)?.[1] || "";
const chapterRecords = (chapterBlock.match(/startSeconds:/g) || []).length;
const guideRecords = (guideBlock.match(/question:/g) || []).length;
if (chapterRecords !== 13) errors.push(`Expected 13 verified George LeMieux chapters, found ${chapterRecords}.`);
if (guideRecords !== 7) errors.push(`Expected 7 transcript-grounded episode-guide entries, found ${guideRecords}.`);

for (const needle of [
  '"@type": "Clip"',
  'data-track-event="Episode Chapter"',
  'data-track-event="Episode Guide"',
  'data-track-event="Related Conversation"',
  'data-episode-guide',
  'data-episode-related',
  'data-episode-newsletter',
  'Newsletter({ compact: true })',
  'setupNewsletter(newsletterNode)',
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
if (!mediaHeader.includes('/src/newsletter.css?v=2')) {
  errors.push("Media pages must load the reusable newsletter stylesheet.");
}

for (const needle of [
  'Newsletter({ compact = false } = {})',
  'newsletter-section-compact'
]) {
  if (!newsletter.includes(needle) && !newsletterStyles.includes(needle)) {
    errors.push(`Reusable newsletter support is missing: ${needle}`);
  }
}

for (const needle of [
  'max-video-preview:-1',
  'youtube-nocookie.com/embed/Kx7rcDzaqDk?rel=0',
  'data-static-episode-chapters',
  'data-static-episode-highlights',
  'data-static-episode-guide',
  'data-static-episode-related',
  '"@type":"Clip"',
  '"dateModified":"2026-08-20"',
  'https://thealanashow.com/episodes/george-lemieux?t=1351',
  '/episodes/ric-bradshaw',
  '/episodes/stacey-ibarra-vaughn-mitchell',
  '/episodes/celeste-ellich-bob-sutton'
]) {
  if (!georgePage.includes(needle)) errors.push(`Static George LeMieux watch page is missing: ${needle}`);
}

const staticChapterLinks = (georgePage.match(/class="episode-chapter-link"/g) || []).length;
const staticGuideEntries = (georgePage.match(/class="episode-guide-item"/g) || []).length;
if (staticChapterLinks !== 13) errors.push(`Expected 13 static chapter links, found ${staticChapterLinks}.`);
if (staticGuideEntries !== 7) errors.push(`Expected 7 static episode-guide entries, found ${staticGuideEntries}.`);

if (!packageJson.includes("episode-editorial-gate.mjs")) {
  errors.push("Episode editorial regression gate must run in npm run quality.");
}

if (errors.length) {
  console.error(`Episode editorial gate failed with ${errors.length} issue${errors.length === 1 ? "" : "s"}:`);
  errors.forEach(error => console.error(`  - ${error}`));
  process.exit(1);
}

console.log("Episode editorial gate passed.");
console.log("  George LeMieux key moments, episode guide, watch-next path, newsletter and measurement: OK");
