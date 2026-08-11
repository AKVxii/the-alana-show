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

const about = read("about/index.html");
const homepage = read("index.html");
const homepageAbout = read("src/components/About.js");
const mediaHeader = read("src/components/MediaHeader.js");
const footer = read("src/components/Footer.js");
const sitemap = read("sitemap.xml");

for (const needle of [
  '<link rel="canonical" href="https://thealanashow.com/about">',
  '<meta name="robots" content="index,follow,max-image-preview:large">',
  '"@type": "ProfilePage"',
  '"@id": "https://thealanashow.com/about#webpage"',
  '"mainEntity": { "@id": "https://thealanashow.com/#alana-k-vandeveer" }',
  '"@type": "Person"',
  '"@id": "https://thealanashow.com/#alana-k-vandeveer"',
  '"url": "https://thealanashow.com/about"',
  '"mainEntityOfPage": { "@id": "https://thealanashow.com/about#webpage" }',
  'https://www.youtube.com/@alanakvandeveer/videos',
  'https://www.instagram.com/alanakvandeveer',
  'https://x.com/alanakvandeveer',
  'https://www.linkedin.com/in/alanakvandeveer',
  'Entrepreneur · Commercial real estate professional · Community advocate · Media host',
  'Raised in a civically engaged Minnesota family and now based in South Florida',
  'If someone isn’t in the room, don’t talk about them.',
  'href="/standards/"',
  'href="/press/">Press &amp; Media Resources</a>',
  'inquiry=Media%20inquiry',
  'src="/assets/alana-portrait-cutout-v2.png"',
  'width="958" height="968"',
  'alt="Alana K. Vandeveer, host of The Alana Show"',
  'data-about-header',
  'data-about-footer',
  '/src/about-page.css',
  '/src/about-page.js'
]) {
  if (!about.includes(needle)) fail(`Host profile is missing required authority markup/content: ${needle}`);
}

for (const needle of [
  '"@id": "https://thealanashow.com/#alana-k-vandeveer"',
  '"url": "https://thealanashow.com/about"',
  '"creator": { "@id": "https://thealanashow.com/#alana-k-vandeveer" }',
  '"founder": { "@id": "https://thealanashow.com/#alana-k-vandeveer" }'
]) {
  if (!homepage.includes(needle)) fail(`Homepage host entity continuity is missing: ${needle}`);
}

if (!homepageAbout.includes('href="/about/">Full host profile')) {
  fail("Homepage host introduction must link to the permanent full profile.");
}

if (!mediaHeader.includes('<a href="/about/">About</a>')) {
  fail("Subpage primary navigation must route About to the permanent host profile.");
}
if (mediaHeader.includes('<a href="/#about">About</a>')) {
  fail("Subpage primary navigation must not route About back to the homepage anchor.");
}

if (!footer.includes('href="/about/">About Alana</a>')) {
  fail("Shared footer must link About Alana to the permanent host profile.");
}

if (!sitemap.includes('<loc>https://thealanashow.com/about</loc>')) {
  fail("Permanent host profile must be represented in sitemap.xml.");
}

if (/thought leader|award-winning|nationally recognized|renowned|celebrity host/i.test(about)) {
  fail("Host profile contains unsupported promotional biography language.");
}

if (failures.length) {
  console.error("Host authority gate failed:");
  failures.forEach(message => console.error(`- ${message}`));
  process.exit(1);
}

console.log("Host authority gate passed.");
console.log("  Canonical ProfilePage, stable Person identity, verified biography, official profiles, homepage/subpage authority paths, press connection and sitemap discovery: OK");
