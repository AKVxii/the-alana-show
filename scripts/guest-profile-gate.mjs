import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

const ROOT = process.cwd();
const catalogUrl = pathToFileURL(path.join(ROOT, "src/data/catalog.js")).href;
const profilesUrl = pathToFileURL(path.join(ROOT, "src/data/guest-profiles.js")).href;
const { guests } = await import(catalogUrl);
const { guestProfiles } = await import(profilesUrl);
const guestIds = new Set(guests.map(guest => guest.id));
const errors = [];

const assert = (condition, message) => {
  if (!condition) errors.push(message);
};

const entries = Object.entries(guestProfiles);
assert(entries.length >= 10, `Expected at least 10 verified guest entity profiles; found ${entries.length}.`);

for (const [id, profile] of entries) {
  assert(guestIds.has(id), `Verified guest profile references unknown catalog guest: ${id}.`);
  assert(typeof profile.role === "string" && profile.role.trim().length >= 8, `${id}: missing useful verified role.`);
  assert(typeof profile.summary === "string" && profile.summary.trim().length >= 60, `${id}: missing useful verified summary.`);
  assert(/^https:\/\//.test(profile.officialUrl || ""), `${id}: officialUrl must be HTTPS.`);
  assert(Array.isArray(profile.sameAs) && profile.sameAs.length >= 1, `${id}: sameAs must contain at least one official identity URL.`);
  assert((profile.sameAs || []).every(url => /^https:\/\//.test(url)), `${id}: every sameAs value must be HTTPS.`);

  const file = path.join(ROOT, `guests/${id}/index.html`);
  assert(fs.existsSync(file), `${id}: guest page is missing.`);
  if (!fs.existsSync(file)) continue;
  const html = fs.readFileSync(file, "utf8");
  assert(html.includes(profile.role), `${id}: static guest page must expose the verified role.`);
  assert(html.includes(profile.summary.replace(/&/g, "&amp;")) || html.includes(profile.summary), `${id}: static guest page must expose the verified summary.`);
  assert(html.includes(profile.officialUrl), `${id}: static guest page must link to the official source.`);
  assert(html.includes('"jobTitle"'), `${id}: Person structured data must include jobTitle.`);
  assert(html.includes('"sameAs"'), `${id}: Person structured data must include sameAs.`);
}

if (errors.length) {
  console.error(`\nVerified guest profile gate failed with ${errors.length} issue${errors.length === 1 ? "" : "s"}:\n`);
  errors.forEach(error => console.error(`  - ${error}`));
  process.exit(1);
}

console.log("Verified guest entity profile gate passed.");
console.log(`  Curated guest profiles: ${entries.length}`);
console.log("  Roles, summaries, official identity URLs, static pages and Person schema: OK");
