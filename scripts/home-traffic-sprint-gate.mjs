import fs from "node:fs";

const errors = [];
const read = file => {
  if (!fs.existsSync(file)) {
    errors.push(`Missing required file: ${file}`);
    return "";
  }
  return fs.readFileSync(file, "utf8");
};

const episodes = read("src/components/Episodes.js");
const main = read("src/main.js");
const home = read("index.html");
const styles = read("src/traffic-sprint.css");
const guestProfile = read("src/data/guest-profiles.js");
const guestPage = read("guests/george-lemieux/index.html");
const packageJson = read("package.json");

for (const needle of [
  'data-initial-src="https://www.youtube-nocookie.com/embed/Kx7rcDzaqDk?rel=0"',
  'href="/episodes/george-lemieux"',
  'href="/episodes/george-lemieux?t=572"',
  'href="/episodes/george-lemieux?t=1351"',
  'href="/episodes/george-lemieux?t=1669"',
  'data-track-event="Homepage Key Moment"'
]) {
  if (!episodes.includes(needle)) errors.push(`Homepage featured-conversation markup is missing: ${needle}`);
}

for (const needle of [
  'FEATURED_CONVERSATION_VIDEO_ID = "Kx7rcDzaqDk"',
  'state.episodes.find(episode => episode.videoId === FEATURED_CONVERSATION_VIDEO_ID) || data.featured',
  'link.href = enriched.detailPath || `https://www.youtube.com/watch?v=${enriched.videoId}`'
]) {
  if (!main.includes(needle)) errors.push(`Homepage routing logic is missing: ${needle}`);
}

for (const needle of [
  '/src/traffic-sprint.css?v=1',
  'static-current-conversation',
  'George LeMieux on leadership, fiscal discipline and Florida’s future',
  '/episodes/george-lemieux?t=1351',
  '20260820-george-featured'
]) {
  if (!home.includes(needle)) errors.push(`Crawler-visible homepage promotion is missing: ${needle}`);
}

for (const needle of [
  '.featured-conversation-actions',
  '.featured-key-moments',
  '.static-current-conversation',
  '@media (max-width: 640px)',
  '@media (prefers-reduced-motion: reduce)'
]) {
  if (!styles.includes(needle)) errors.push(`Traffic-promotion styling is missing: ${needle}`);
}

for (const needle of [
  'Founder and Chair, LeMieux Center for Public Policy',
  'https://www.pba.edu/academics/schools/centers-of-excellence/lemieux/',
  'https://www.pba.edu/academics/schools/centers-of-excellence/lemieux/staff/'
]) {
  if (!guestProfile.includes(needle)) errors.push(`Verified George LeMieux profile data is missing: ${needle}`);
  if (!guestPage.includes(needle.replace('Founder and Chair, LeMieux Center for Public Policy', 'Founder and Chair, LeMieux Center for Public Policy')) && needle.startsWith("https://")) {
    errors.push(`Crawler-visible George LeMieux page is missing official identity link: ${needle}`);
  }
}

if (!guestPage.includes('href="/episodes/george-lemieux"')) {
  errors.push("George LeMieux’s guest page must link directly to the canonical episode.");
}

if (!packageJson.includes("home-traffic-sprint-gate.mjs")) {
  errors.push("The homepage traffic sprint regression gate must run in npm run quality.");
}

if (errors.length) {
  console.error(`Homepage traffic sprint gate failed with ${errors.length} issue${errors.length === 1 ? "" : "s"}:`);
  errors.forEach(error => console.error(`  - ${error}`));
  process.exit(1);
}

console.log("Homepage traffic sprint gate passed.");
console.log("  Latest conversation prominence, internal routing, key moments and guest authority: OK");
