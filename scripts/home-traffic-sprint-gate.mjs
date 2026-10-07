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
const episodeArchive = read("src/episodes-page.js");
const youtubeApi = read("api/youtube.js");
const home = read("index.html");
const styles = read("src/brand-refresh.css");
const guestProfile = read("src/data/guest-profiles.js");
const guestPage = read("guests/george-lemieux/index.html");
const packageJson = read("package.json");

for (const needle of [
  'data-initial-src="https://www.youtube-nocookie.com/embed/SqRazfeMcTk?rel=0"',
  'href="/episodes/ric-bradshaw"',
  'data-track-event="Homepage Featured Conversation"',
  'href="/guests/ric-bradshaw"',
  'data-track-event="Homepage Featured Guest"'
]) {
  if (!episodes.includes(needle)) errors.push(`Homepage featured-conversation markup is missing: ${needle}`);
}

for (const needle of [
  'FEATURED_CONVERSATION_VIDEO_ID = "SqRazfeMcTk"',
  'state.episodes.find(episode => episode.videoId === FEATURED_CONVERSATION_VIDEO_ID) || data.featured',
  'link.href = enriched.detailPath || `https://www.youtube.com/watch?v=${enriched.videoId}`'
]) {
  if (!main.includes(needle)) errors.push(`Homepage routing logic is missing: ${needle}`);
}

if (!episodeArchive.includes('FEATURED_CONVERSATION_VIDEO_ID = "SqRazfeMcTk"')) {
  errors.push("The episode archive must feature the current Sheriff Ric Bradshaw interview.");
}
if (!youtubeApi.includes('FEATURED_CONVERSATION_VIDEO_ID = "SqRazfeMcTk"')) {
  errors.push("The live YouTube feed must expose Sheriff Ric Bradshaw as the selected featured conversation.");
}

for (const needle of [
  'static-current-conversation',
  'Sheriff Ric Bradshaw on Flock cameras, Amendment 3 and the budget',
  'https://www.youtube.com/watch?v=SqRazfeMcTk',
  '/guests/ric-bradshaw'
]) {
  if (!home.includes(needle)) errors.push(`Crawler-visible homepage promotion is missing: ${needle}`);
}

for (const needle of [
  '.featured-conversation-actions',
  '.static-current-conversation',
  '@media(max-width:600px)',
  '@media(prefers-reduced-motion:reduce)'
]) {
  if (!styles.includes(needle)) errors.push(`Traffic-promotion styling is missing: ${needle}`);
}

for (const needle of [
  'Founder and Chair, LeMieux Center for Public Policy',
  'https://www.pba.edu/academics/schools/centers-of-excellence/lemieux/',
  'https://www.pba.edu/academics/schools/centers-of-excellence/lemieux/staff/'
]) {
  if (!guestProfile.includes(needle)) errors.push(`Verified George LeMieux profile data is missing: ${needle}`);
}
for (const officialUrl of [
  'https://www.gunster.com/people/george-s-lemieux',
  'https://www.pba.edu/academics/schools/centers-of-excellence/lemieux/',
  'https://www.pba.edu/academics/schools/centers-of-excellence/lemieux/staff/'
]) {
  if (!guestPage.includes(officialUrl)) errors.push(`Crawler-visible George LeMieux page is missing official identity link: ${officialUrl}`);
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
console.log("  Focused conversation prominence, internal routing, live feed and guest authority: OK");
