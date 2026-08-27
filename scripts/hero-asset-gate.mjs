import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

const errors = [];
const fail = message => errors.push(message);
const ROOT = process.cwd();
const SOURCE = "assets/alana-portrait-cutout.png";
const PNG = "assets/alana-portrait-host-v4.png";
const WEBP = "assets/alana-portrait-host-v4.webp";
const PNG_URL = "/assets/alana-portrait-host-v4.png";
const WEBP_URL = "/assets/alana-portrait-host-v4.webp";
const SCHEMA_PNG_URL = "/assets/alana-portrait-cutout-v2.png";
const EXPECTED_SOURCE_BYTES = 1_003_924;
const EXPECTED_PNG_BYTES = 563_742;
const EXPECTED_WEBP_BYTES = 327_234;
const EXPECTED_WIDTH = 958;
const EXPECTED_HEIGHT = 968;
const EXPECTED_PNG_BLOB_SHA = "425bb9ce1c828a86ed1f49805d22102e6178299a";
const EXPECTED_WEBP_BLOB_SHA = "cadd115a26a190b22b145facea205ab19f9106a8";

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

if (!hero.includes(`const ALANA_PORTRAIT_WEBP = "${WEBP_URL}"`)) fail("Hero component is not using the preferred lossless WebP portrait.");
if (!hero.includes(`const ALANA_PORTRAIT_PNG = "${PNG_URL}"`)) fail("Hero component is missing the verified PNG fallback.");
if (!hero.includes(`<source srcset="${'${ALANA_PORTRAIT_WEBP}'}" type="image/webp">`)) fail("Hero picture source must prefer lossless WebP.");
if (!index.includes(`rel="preload" as="image" href="${WEBP_URL}" type="image/webp"`)) fail("Homepage is not preloading the preferred hero WebP.");
if (!index.includes(`"image": "https://thealanashow.com${SCHEMA_PNG_URL}"`)) fail("Homepage Person schema must keep the broadly compatible verified identity portrait.");
for (const url of [PNG_URL, WEBP_URL]) {
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
console.log("  Approved host portrait: 958x968 PNG + lossless WebP");
console.log(`  Host PNG: ${EXPECTED_PNG_BYTES.toLocaleString()} bytes`);
console.log(`  Preferred lossless WebP: ${EXPECTED_WEBP_BYTES.toLocaleString()} bytes`);
console.log("  Verified binary pins + PNG fallback + WebP preload + immutable caching: OK");
