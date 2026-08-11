import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

const errors = [];
const fail = message => errors.push(message);
const ROOT = process.cwd();
const SOURCE = "assets/alana-portrait-cutout.png";
const OPTIMIZED = "assets/alana-portrait-cutout-v2.png";
const OPTIMIZED_URL = "/assets/alana-portrait-cutout-v2.png";
const EXPECTED_BYTES = 587_954;
const EXPECTED_WIDTH = 958;
const EXPECTED_HEIGHT = 968;
const EXPECTED_GIT_BLOB_SHA = "2984563bfe50166efc4c32ce230e192725ef9f04";

function read(relative) {
  return fs.readFileSync(path.join(ROOT, relative), "utf8");
}

function pngDimensions(buffer) {
  const signature = buffer.subarray(0, 8).toString("hex");
  if (signature !== "89504e470d0a1a0a") return null;
  return {
    width: buffer.readUInt32BE(16),
    height: buffer.readUInt32BE(20)
  };
}

function gitBlobSha(buffer) {
  const header = Buffer.from(`blob ${buffer.length}\0`);
  return crypto.createHash("sha1").update(header).update(buffer).digest("hex");
}

for (const relative of [SOURCE, OPTIMIZED]) {
  if (!fs.existsSync(path.join(ROOT, relative))) fail(`Missing hero asset: ${relative}`);
}

if (!errors.length) {
  const sourceBytes = fs.statSync(path.join(ROOT, SOURCE)).size;
  const optimizedBytes = fs.statSync(path.join(ROOT, OPTIMIZED)).size;
  const optimizedBuffer = fs.readFileSync(path.join(ROOT, OPTIMIZED));
  const dimensions = pngDimensions(optimizedBuffer);
  const blobSha = gitBlobSha(optimizedBuffer);

  if (sourceBytes < 10_000_000) fail("Legacy hero source unexpectedly changed; revalidate the optimization baseline.");
  if (optimizedBytes !== EXPECTED_BYTES) fail(`Optimized hero byte size changed: expected ${EXPECTED_BYTES}, got ${optimizedBytes}.`);
  if (optimizedBytes >= sourceBytes * 0.05) fail("Optimized hero must remain at least 95% smaller than the legacy source.");
  if (!dimensions || dimensions.width !== EXPECTED_WIDTH || dimensions.height !== EXPECTED_HEIGHT) {
    fail(`Optimized hero dimensions must remain ${EXPECTED_WIDTH}x${EXPECTED_HEIGHT}.`);
  }

  // The one-time encoder verified the source and optimized file decode to exactly
  // the same 958x968 RGBA pixels. Pin that verified binary so any future image
  // change requires an explicit visual-verification pass instead of silently shipping.
  if (blobSha !== EXPECTED_GIT_BLOB_SHA) {
    fail("Optimized hero binary changed; re-run pixel-identical visual verification before updating the pinned blob SHA.");
  }
}

const hero = read("src/components/Hero.js");
const index = read("index.html");
const vercel = read("vercel.json");

if (!hero.includes(`const ALANA_PORTRAIT_SRC = "${OPTIMIZED_URL}"`)) fail("Hero component is not using the optimized portrait.");
if (!index.includes(`rel="preload" as="image" href="${OPTIMIZED_URL}"`)) fail("Homepage is not preloading the optimized hero portrait.");
if (!index.includes(`"image": "https://thealanashow.com${OPTIMIZED_URL}"`)) fail("Homepage Person schema is not using the optimized portrait.");
if (!vercel.includes(`"source": "${OPTIMIZED_URL}"`)) fail("Versioned hero asset is missing its dedicated cache rule.");
if (!vercel.includes('"value": "public, max-age=31556952, immutable"')) fail("Versioned hero asset must retain long-lived immutable browser caching.");

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
    if (text.includes(oldReference)) fail(`Legacy 17 MB hero asset is still referenced by ${relative}.`);
  }
}

scan(ROOT);

if (errors.length) {
  console.error(`\nHero asset gate failed with ${errors.length} issue${errors.length === 1 ? "" : "s"}:\n`);
  errors.forEach(error => console.error(`  - ${error}`));
  process.exit(1);
}

console.log("Hero asset gate passed.");
console.log("  Pixel-verified production asset: 958x968 PNG");
console.log(`  Transfer baseline: ${EXPECTED_BYTES.toLocaleString()} bytes`);
console.log("  Verified binary pin + dimensions: OK");
console.log("  Legacy 17 MB asset absent from public code paths: OK");
console.log("  High-priority preload + Person schema + immutable caching: OK");
