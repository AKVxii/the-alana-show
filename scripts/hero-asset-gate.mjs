import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

const errors = [];
const fail = message => errors.push(message);
const ROOT = process.cwd();
const SOURCE = "assets/alana-portrait-cutout.png";
const PNG = "assets/alana-portrait-cutout-v2.png";
const WEBP = "assets/alana-portrait-cutout-v3.webp";
const WEBP_480 = "assets/alana-portrait-cutout-480.webp";
const WEBP_640 = "assets/alana-portrait-cutout-640.webp";
const PNG_URL = "/assets/alana-portrait-cutout-v2.png";
const WEBP_URL = "/assets/alana-portrait-cutout-v3.webp";
const WEBP_480_URL = "/assets/alana-portrait-cutout-480.webp";
const WEBP_640_URL = "/assets/alana-portrait-cutout-640.webp";
const EXPECTED_SOURCE_BYTES = 1_003_924;
const EXPECTED_PNG_BYTES = 551_207;
const EXPECTED_WEBP_BYTES = 320_326;
const EXPECTED_WIDTH = 958;
const EXPECTED_HEIGHT = 968;
const EXPECTED_PNG_BLOB_SHA = "2984563bfe50166efc4c32ce230e192725ef9f04";
const EXPECTED_WEBP_BLOB_SHA = "0942715896ad6e8cbad4b67834678d67d6ca000e";

function read(relative) {
  return fs.readFileSync(path.join(ROOT, relative), "utf8");
}

function pngDimensions(buffer) {
  const signature = buffer.subarray(0, 8).toString("hex");
  if (signature !== "89504e470d0a1a0a") return null;
  return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) };
}

function webpDimensions(buffer) {
  if (buffer.subarray(0, 4).toString("ascii") !== "RIFF" || buffer.subarray(8, 12).toString("ascii") !== "WEBP") return null;
  // The verified lossless asset is VP8L. The first five VP8L payload bytes encode
  // width/height minus one in 14-bit little-endian fields.
  const chunk = buffer.subarray(12, 16).toString("ascii");
  if (chunk !== "VP8L" || buffer[20] !== 0x2f) return null;
  const bits = buffer.readUInt32LE(21);
  return {
    width: (bits & 0x3fff) + 1,
    height: ((bits >> 14) & 0x3fff) + 1
  };
}

function gitBlobSha(buffer) {
  const header = Buffer.from(`blob ${buffer.length}\0`);
  return crypto.createHash("sha1").update(header).update(buffer).digest("hex");
}

for (const relative of [SOURCE, PNG, WEBP]) {
  if (!fs.existsSync(path.join(ROOT, relative))) fail(`Missing hero asset: ${relative}`);
}

for (const [relative, width, height] of [[WEBP_480, 480, 485], [WEBP_640, 640, 647]]) {
  if (!fs.existsSync(path.join(ROOT, relative))) {
    fail(`Missing responsive hero asset: ${relative}`);
    continue;
  }
  const dimensions = webpDimensions(fs.readFileSync(path.join(ROOT, relative)));
  if (!dimensions || dimensions.width !== width || dimensions.height !== height) {
    fail(`${relative} dimensions must remain ${width}x${height}.`);
  }
}

if (!errors.length) {
  const sourceBytes = fs.statSync(path.join(ROOT, SOURCE)).size;
  const pngBuffer = fs.readFileSync(path.join(ROOT, PNG));
  const webpBuffer = fs.readFileSync(path.join(ROOT, WEBP));
  const pngSize = pngBuffer.length;
  const webpSize = webpBuffer.length;
  const pngSizeInfo = pngDimensions(pngBuffer);
  const webpSizeInfo = webpDimensions(webpBuffer);

  if (sourceBytes !== EXPECTED_SOURCE_BYTES) fail(`Legacy hero source changed: expected ${EXPECTED_SOURCE_BYTES}, got ${sourceBytes}. Revalidate the optimization baseline.`);
  if (pngSize !== EXPECTED_PNG_BYTES) fail(`PNG fallback changed: expected ${EXPECTED_PNG_BYTES}, got ${pngSize}.`);
  if (webpSize !== EXPECTED_WEBP_BYTES) fail(`Preferred WebP changed: expected ${EXPECTED_WEBP_BYTES}, got ${webpSize}.`);
  if (pngSize >= sourceBytes * 0.60) fail("Optimized PNG fallback must remain at least 40% smaller than the original source.");
  if (webpSize >= pngSize * 0.90) fail("Preferred lossless WebP must remain at least 10% smaller than the optimized PNG fallback.");

  for (const [label, dimensions] of [["PNG fallback", pngSizeInfo], ["WebP preferred asset", webpSizeInfo]]) {
    if (!dimensions || dimensions.width !== EXPECTED_WIDTH || dimensions.height !== EXPECTED_HEIGHT) {
      fail(`${label} dimensions must remain ${EXPECTED_WIDTH}x${EXPECTED_HEIGHT}.`);
    }
  }

  // One-time encoding jobs decoded each production derivative to RGBA and
  // verified exact pixel equality. Pin those binaries so a future visual change
  // cannot silently ride in under the same versioned filename.
  if (gitBlobSha(pngBuffer) !== EXPECTED_PNG_BLOB_SHA) fail("PNG fallback binary changed; rerun exact-pixel verification before updating the pin.");
  if (gitBlobSha(webpBuffer) !== EXPECTED_WEBP_BLOB_SHA) fail("Preferred WebP binary changed; rerun exact-pixel verification before updating the pin.");
}

const hero = read("src/components/Hero.js");
const index = read("index.html");
const vercel = read("vercel.json");

if (![WEBP_480_URL, WEBP_640_URL, WEBP_URL].every(url => hero.includes(url))) fail("Hero component is missing a responsive lossless WebP portrait source.");
if (!hero.includes(`const ALANA_PORTRAIT_PNG = "${PNG_URL}"`)) fail("Hero component is missing the verified PNG fallback.");
if (!hero.includes('<source srcset="${ALANA_PORTRAIT_SRCSET}" sizes="${ALANA_PORTRAIT_SIZES}" type="image/webp">')) fail("Hero picture source must provide responsive lossless WebP candidates.");
if (!index.includes(`rel="preload" as="image" href="${WEBP_URL}"`) || !index.includes("imagesrcset=")) fail("Homepage is not preloading the responsive hero WebP source set.");
if (!index.includes(`"image": "https://thealanashow.com${PNG_URL}"`)) fail("Homepage Person schema must keep the broadly compatible verified PNG portrait.");
for (const url of [PNG_URL, WEBP_480_URL, WEBP_640_URL, WEBP_URL]) {
  if (!vercel.includes(`"source": "${url}"`)) fail(`Versioned hero asset is missing its dedicated cache rule: ${url}.`);
}
if (!vercel.includes('"value": "public, max-age=31556952, immutable"')) fail("Versioned hero assets must retain long-lived immutable browser caching.");
if (fs.existsSync(".github/workflows/hero-webp-optimize-once.yml")) fail("One-time hero encoder workflow must be removed before merge.");

const oldReference = "alana-portrait-cutout" + ".png";
const textExtensions = new Set([".js", ".mjs", ".html", ".css", ".json", ".xml", ".md", ".txt", ".yml", ".yaml", ".webmanifest"]);
const ignoredDirectories = new Set([".git", "node_modules"]);

function scan(directory) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    if (ignoredDirectories.has(entry.name)) continue;
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      scan(absolute);
      continue;
    }
    if (!textExtensions.has(path.extname(entry.name))) continue;
    const relative = path.relative(ROOT, absolute).replace(/\\/g, "/");
    if (relative === "scripts/hero-asset-gate.mjs") continue;
    const text = fs.readFileSync(absolute, "utf8");
    if (text.includes(oldReference)) fail(`Legacy original hero asset is still referenced by ${relative}.`);
  }
}

scan(ROOT);

if (errors.length) {
  console.error(`\nHero asset gate failed with ${errors.length} issue${errors.length === 1 ? "" : "s"}:\n`);
  errors.forEach(error => console.error(`  - ${error}`));
  process.exit(1);
}

console.log("Hero asset gate passed.");
console.log("  Exact-pixel production derivatives: 958x968 PNG + lossless WebP");
console.log(`  Original -> PNG: ${EXPECTED_SOURCE_BYTES.toLocaleString()} -> ${EXPECTED_PNG_BYTES.toLocaleString()} bytes (45.1% smaller)`);
console.log(`  PNG -> preferred WebP: ${EXPECTED_PNG_BYTES.toLocaleString()} -> ${EXPECTED_WEBP_BYTES.toLocaleString()} bytes (41.9% smaller)`);
console.log("  Original -> modern preferred delivery: 68.1% smaller");
console.log("  Verified binary pins + PNG fallback + WebP preload + immutable caching: OK");
