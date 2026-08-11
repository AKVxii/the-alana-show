import fs from "node:fs";

const errors = [];
const read = file => fs.existsSync(file) ? fs.readFileSync(file, "utf8") : "";
const assert = (condition, message) => { if (!condition) errors.push(message); };
const WEBP = "/assets/alana-portrait-cutout-v3.webp";
const PNG = "/assets/alana-portrait-cutout-v2.png";

const homeAbout = read("src/components/About.js");
const aboutPage = read("about/index.html");
const pressPage = read("press/index.html");

assert(homeAbout.includes(`const ALANA_PORTRAIT_WEBP = "${WEBP}"`), "Homepage About section must reference the verified lossless WebP portrait.");
assert(homeAbout.includes(`const ALANA_PORTRAIT_PNG = "${PNG}"`), "Homepage About section must retain the verified PNG fallback.");
assert(homeAbout.includes('<source srcset="${ALANA_PORTRAIT_WEBP}" type="image/webp">'), "Homepage About picture must prefer lossless WebP.");
assert(homeAbout.includes('<img src="${ALANA_PORTRAIT_PNG}"'), "Homepage About picture must retain the PNG fallback image.");
assert(homeAbout.includes('loading="lazy"'), "Below-the-fold homepage About portrait must remain lazy-loaded.");

assert(aboutPage.includes(`<source srcset="${WEBP}" type="image/webp">`), "Permanent About page portrait must prefer lossless WebP.");
assert(aboutPage.includes(`<img src="${PNG}" alt="Alana K. Vandeveer, host of The Alana Show"`), "Permanent About page must retain its verified PNG fallback and accessible alt text.");
assert(aboutPage.includes('fetchpriority="high"'), "Permanent About hero portrait must retain high fetch priority.");
assert(aboutPage.includes(`"image": "https://thealanashow.com${PNG}"`), "About-page Person schema must retain the broadly compatible PNG identity image.");

assert(pressPage.includes(`<source srcset="${WEBP}" type="image/webp">`), "Press asset preview must prefer lossless WebP for browser display.");
assert(pressPage.includes(`<img src="${PNG}" alt="Alana K. Vandeveer, host of The Alana Show"`), "Press preview must retain the approved PNG fallback.");
assert(pressPage.includes(`<a href="${PNG}" download>Download PNG</a>`), "Press page must continue offering the approved transparent PNG—not WebP—as the downloadable media asset.");
assert(!pressPage.includes(`<a href="${WEBP}" download>`), "Lossless WebP is a delivery optimization and must not replace the approved press download.");
assert(pressPage.includes("PNG · transparent background"), "Press asset labeling must continue describing the downloadable PNG accurately.");

assert(!fs.existsSync(".github/workflows/portrait-delivery-once.yml"), "One-time portrait delivery workflow must be removed before merge.");

if (errors.length) {
  console.error(`\nPortrait delivery gate failed with ${errors.length} issue${errors.length === 1 ? "" : "s"}:\n`);
  errors.forEach(error => console.error(`  - ${error}`));
  process.exit(1);
}

console.log("Portrait delivery gate passed.");
console.log("  Homepage About display: lossless WebP preferred + PNG fallback + lazy load: OK");
console.log("  Permanent About hero: lossless WebP preferred + PNG identity/schema fallback: OK");
console.log("  Press preview: lossless WebP preferred; approved transparent PNG remains downloadable: OK");
console.log("  No visual-source or press-asset contract changed: OK");
