import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const failures = [];
const fail = message => failures.push(message);
const read = relative => {
  const absolute = path.join(ROOT, relative);
  if (!fs.existsSync(absolute)) {
    fail(`Missing required file: ${relative}`);
    return "";
  }
  return fs.readFileSync(absolute, "utf8");
};

const press = read("press/index.html");
const share = read("src/lib/share.js");
const mediaHeader = read("src/components/MediaHeader.js");
const footer = read("src/components/Footer.js");
const sitemap = read("sitemap.xml");

for (const needle of [
  '<link rel="canonical" href="https://thealanashow.com/press">',
  '<meta name="robots" content="index,follow,max-image-preview:large">',
  'Official press and media resources for The Alana Show',
  'Tuesdays · 8:00 PM – 9:00 PM ET',
  'True Oldies · South Florida',
  'href="/about/">Official Host Profile</a>',
  'href="/assets/alana-show-logo.svg" download',
  'href="/assets/alana-show-social-card-2026-imessage-v2.png" download',
  'href="/assets/alana-portrait-cutout.png" download',
  'Audience or reach figures are intentionally not listed here unless they can be supported by current source data.',
  'href="/standards/"',
  'inquiry=Media%20inquiry',
  'data-press-header',
  'data-press-footer',
  '/src/press-page.css',
  '/src/press-page.js'
]) {
  if (!press.includes(needle)) fail(`Press page is missing required distribution authority content: ${needle}`);
}

for (const asset of [
  "assets/alana-show-logo.svg",
  "assets/alana-show-social-card-2026-imessage-v2.png",
  "assets/alana-portrait-cutout.png"
]) {
  if (!fs.existsSync(path.join(ROOT, asset))) fail(`Press page references missing official asset: ${asset}`);
}

for (const needle of [
  'document.body.dataset.detailType !== "episode"',
  'navigator.share',
  'navigator.clipboard?.writeText',
  'document.execCommand("copy")',
  'url.searchParams.set("t"',
  'button.textContent = "Share conversation"',
  'temporaryLabel(button, "Link copied")',
  'trackEvent("Conversation Share"'
]) {
  if (!share.includes(needle)) fail(`Native share implementation is missing: ${needle}`);
}

if (!mediaHeader.includes('import { setupConversationShare } from "../lib/share.js";')) {
  fail("Media shell must import the conversation share enhancement.");
}
if (!mediaHeader.includes("setupConversationShare();")) {
  fail("Media navigation setup must activate conversation sharing after detail content renders.");
}

if (!footer.includes('href="/press/">Press &amp; Media</a>')) {
  fail("Shared footer must expose Press & Media resources.");
}
if (!sitemap.includes('<loc>https://thealanashow.com/press</loc>')) {
  fail("Press & Media page must be represented in sitemap.xml.");
}

const riskyAudienceClaim = /\b(?:reaches?|audience|listeners?|viewers?)\s+(?:of\s+)?(?:over\s+|more\s+than\s+)?\d[\d,.]*\s*(?:million|thousand|m\b|k\b)/i;
if (riskyAudienceClaim.test(press)) {
  fail("Press page must not publish an unsupported numeric audience/reach claim.");
}

if (failures.length) {
  console.error("Distribution authority gate failed:");
  failures.forEach(message => console.error(`- ${message}`));
  process.exit(1);
}

console.log("Distribution authority gate passed.");
console.log("  Native conversation sharing, timestamp-preserving deep links, official press assets, verified program details, footer discovery and sitemap coverage: OK");
