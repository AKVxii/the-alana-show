import crypto from "node:crypto";
import fs from "node:fs";

const errors = [];
const assert = (condition, message) => { if (!condition) errors.push(message); };
const read = file => fs.existsSync(file) ? fs.readFileSync(file, "utf8") : "";
const blobSha = buffer => crypto.createHash("sha1").update(Buffer.from(`blob ${buffer.length}\0`)).update(buffer).digest("hex");

const assets = [
  {
    source: "assets/broadcast-reach-south-florida.png",
    preferred: "assets/broadcast-reach-south-florida-v2.webp",
    sourceBytes: 1_915_682,
    preferredBytes: 1_414_460,
    preferredBlob: "7bf797cd7643607375aa7b60b10155ec180a645f",
    sourceRef: "/assets/broadcast-reach-south-florida.png",
    preferredRef: "/assets/broadcast-reach-south-florida-v2.webp"
  },
  {
    source: "assets/alana-show-merchandise-collection.png",
    preferred: "assets/alana-show-merchandise-collection-v2.webp",
    sourceBytes: 1_596_428,
    preferredBytes: 1_138_264,
    preferredBlob: "adfc25dc43e04e690afbac1bce02b98f246efa69",
    sourceRef: "/assets/alana-show-merchandise-collection.png",
    preferredRef: "/assets/alana-show-merchandise-collection-v2.webp"
  }
];

for (const asset of assets) {
  assert(fs.existsSync(asset.source), `Missing PNG fallback: ${asset.source}`);
  assert(fs.existsSync(asset.preferred), `Missing lossless WebP: ${asset.preferred}`);
  if (!fs.existsSync(asset.source) || !fs.existsSync(asset.preferred)) continue;

  const sourceSize = fs.statSync(asset.source).size;
  const preferred = fs.readFileSync(asset.preferred);
  const savings = 1 - preferred.length / sourceSize;
  assert(sourceSize === asset.sourceBytes, `${asset.source} changed; revalidate the exact-pixel optimization baseline.`);
  assert(preferred.length === asset.preferredBytes, `${asset.preferred} byte size changed; revalidate before shipping.`);
  assert(blobSha(preferred) === asset.preferredBlob, `${asset.preferred} binary changed; exact-pixel verification must be rerun.`);
  assert(savings >= 0.20, `${asset.preferred} must remain at least 20% smaller than its PNG fallback.`);
}

const broadcast = read("src/components/BroadcastReach.js");
assert(broadcast.includes('srcset="/assets/broadcast-reach-south-florida-v2.webp"'), "Broadcast component must prefer the verified lossless WebP.");
assert(broadcast.includes('src="/assets/broadcast-reach-south-florida.png"'), "Broadcast component must retain the approved PNG fallback.");
assert(broadcast.includes('type="image/webp"'), "Broadcast preferred source must declare image/webp.");

const merchHome = read("src/components/Merchandise.js");
const merchPage = read("merchandise/index.html");
for (const [label, text] of [["homepage merchandise teaser", merchHome], ["merchandise page", merchPage]]) {
  assert(text.includes('srcset="/assets/alana-show-merchandise-collection-v2.webp"'), `${label} must prefer the verified lossless WebP.`);
  assert(text.includes('src="/assets/alana-show-merchandise-collection.png"'), `${label} must retain the approved PNG fallback.`);
  assert(text.includes('type="image/webp"'), `${label} preferred source must declare image/webp.`);
}

const vercel = read("vercel.json");
for (const asset of assets) {
  assert(vercel.includes(`"source": "${asset.preferredRef}"`), `${asset.preferredRef} is missing its immutable cache rule.`);
}
const immutableMatches = vercel.match(/public, max-age=31556952, immutable/g) || [];
assert(immutableMatches.length >= 3, "Versioned optimized portrait + marketing assets must retain immutable caching.");
assert(!fs.existsSync(".github/workflows/marketing-assets-optimize-once.yml"), "One-time encoding workflow must not remain after verified assets are committed.");

if (errors.length) {
  console.error(`\nMarketing asset gate failed with ${errors.length} issue${errors.length === 1 ? "" : "s"}:\n`);
  errors.forEach(error => console.error(`  - ${error}`));
  process.exit(1);
}

console.log("Marketing asset gate passed.");
console.log("  Broadcast: 1,915,682 -> 1,414,460 bytes (26.2% smaller, exact decoded RGBA)");
console.log("  Merchandise: 1,596,428 -> 1,138,264 bytes (28.7% smaller, exact decoded RGBA)");
console.log("  PNG fallbacks + lossless WebP preference + immutable caching: OK");
console.log("  Verified binaries pinned against silent visual changes: OK");
