import fs from "node:fs";

const errors = [];
const read = file => {
  if (!fs.existsSync(file)) {
    errors.push(`Missing required file: ${file}`);
    return "";
  }
  return fs.readFileSync(file, "utf8");
};

const readiness = read("scripts/release-readiness.mjs");
const packageJson = read("package.json");

for (const needle of [
  'Canonical episode page exists',
  'Canonical tag matches permanent URL',
  'Verified YouTube master is on the page',
  'VideoObject structured data exists',
  'Standard sitemap includes canonical episode',
  'Video sitemap includes canonical episode',
  'Guest profile links to episode',
  '5–8 transcript-derived Shorts opportunities',
  'YouTube A/B testing',
  'Intentional YouTube end screen',
  'Search Console live test/index request',
  'Organic growth principle'.toUpperCase()
]) {
  if (!readiness.toUpperCase().includes(needle.toUpperCase())) errors.push(`Release readiness checker is missing: ${needle}`);
}

if (!packageJson.includes('"release:check": "node scripts/release-readiness.mjs"')) {
  errors.push("package.json must expose npm run release:check.");
}
if (!packageJson.includes("release-readiness-gate.mjs")) {
  errors.push("Release readiness gate must run in npm run quality.");
}

if (errors.length) {
  console.error(`Release readiness gate failed with ${errors.length} issue${errors.length === 1 ? "" : "s"}:`);
  errors.forEach(error => console.error(`  - ${error}`));
  process.exit(1);
}

console.log("Release readiness gate passed.");
console.log("  Owned-media verification + repeatable platform checklist: OK");
