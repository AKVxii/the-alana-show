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
const siteData = read("src/data/site.js");
const currentSpecial = read("src/data/current-special.js");
const candidates = read("src/candidates-page.js");
const candidateFallback = read("candidates/index.html");
const press = read("press/index.html");

assert(!broadcast.includes("broadcast-reach-south-florida"), "Broadcast component must not render the retired artwork with stale schedule and geographic claims.");
assert(broadcast.includes("site.broadcast.summary"), "Broadcast component must use the centralized verified broadcast summary.");
assert(broadcast.includes("site.broadcast.dialPositions"), "Broadcast component must use the centralized, unpaired dial-position list.");
assert(siteData.includes('Tuesdays · 8:00 PM – 8:30 PM ET'), "Central broadcast schedule must match the current official True Oldies show page.");
assert(siteData.includes('Tuesdays on True Oldies across South Florida, with worldwide streaming and video.'), "Central broadcast summary must retain the verified public wording.");

const verifiedClaimSurfaces = [broadcast, siteData, currentSpecial, candidates, candidateFallback, press].join("\n");
assert(!/8:00 PM\s*(?:–|-|to)\s*9:00 PM/i.test(verifiedClaimSurfaces), "Public broadcast surfaces must not retain the obsolete one-hour schedule.");
assert(!/\b(?:five[- ]brand|5[- ]brand|16[- ]signal|South (?:and|&) Central Florida|Broward|Orlando|Miami-Dade|Martin|St\. Lucie)\b/i.test(verifiedClaimSurfaces), "Public broadcast surfaces must not publish unsupported network-size or county/region claims.");
assert(candidates.includes("No payment is collected through Calendly."), "Candidate scheduling must state that Calendly does not collect payment.");
assert(candidates.includes("the campaign receives Alana K. Vandeveer's W-9 and written payment instructions"), "Candidate scheduling must identify the post-request W-9 and written-payment flow.");
assert(candidates.includes("Payment is due at booking!"), "Candidate scheduling must state the approved payment timing.");
assert(!/payment confirmation (?:is required|must be completed) by the stated deadline|hold is released/i.test(candidates + candidateFallback + currentSpecial), "Candidate scheduling must not retain the superseded deadline-or-hold language.");
assert(candidateFallback.includes("No payment is collected through Calendly."), "Candidate static fallback must preserve the no-Calendly-payment disclosure.");
assert(candidateFallback.includes("the campaign receives Alana K. Vandeveer's W-9 and written payment instructions"), "Candidate static fallback must preserve the post-request W-9 and written-payment flow.");
assert(candidateFallback.includes("Payment is due at booking!"), "Candidate static fallback must preserve the approved payment timing.");
assert(candidates.includes('data-candidate-archive-status="pending"'), "Candidate archive pathway must stay pending until a verified 2026 candidate interview publishes.");
assert(!/View Candidate Conversations|View the Candidate Series/.test(candidates + candidateFallback), "Candidate pages must not imply a published series before the first verified interview.");
assert(candidateFallback.includes('/src/candidates-page.js?v=20260820-payment-booking'), "Candidate entry script must carry the current approved payment-copy cache key.");

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
assert(
  vercel.includes('"source": "/src/(.*)"') && vercel.includes('"value": "public, max-age=0, must-revalidate"'),
  "Stable source-module URLs must revalidate so editorial and thumbnail fixes reach returning visitors."
);
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
console.log("  Broadcast UI uses centralized schedule, broad South Florida language and unpaired dial positions: OK");
