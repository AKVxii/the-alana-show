import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

const ROOT = process.cwd();
const ORIGIN = "https://thealanashow.com";
const args = process.argv.slice(2).filter(arg => !arg.startsWith("--"));
const token = args[0] || "";

const catalogUrl = `${pathToFileURL(path.join(ROOT, "src/data/catalog.js")).href}?release=${Date.now()}`;
const { episodes, guestById } = await import(catalogUrl);

function fail(message) {
  console.error(`\nRelease readiness unavailable: ${message}\n`);
  process.exit(1);
}

function read(relative) {
  const absolute = path.join(ROOT, relative);
  return fs.existsSync(absolute) ? fs.readFileSync(absolute, "utf8") : "";
}

function episodeFromToken(value) {
  if (!value) return null;
  const possibleFile = path.resolve(ROOT, value);
  if (fs.existsSync(possibleFile) && fs.statSync(possibleFile).isFile()) {
    let payload;
    try {
      payload = JSON.parse(fs.readFileSync(possibleFile, "utf8"));
    } catch (error) {
      fail(`could not parse ${value}: ${error.message}`);
    }
    const videoId = String(payload.videoId || "").trim();
    const slug = String(payload.slug || "").trim();
    return episodes.find(episode => episode.videoId === videoId || episode.id === slug) || null;
  }
  return episodes.find(episode => episode.id === value || episode.videoId === value) || null;
}

let episode = episodeFromToken(token);
if (!episode && !token) {
  const defaultInput = path.join(ROOT, "content/conversation.json");
  if (fs.existsSync(defaultInput)) episode = episodeFromToken("content/conversation.json");
}
if (!episode) {
  fail("provide a published episode slug, YouTube video ID, or conversation JSON file. Example: npm run release:check -- scott-diament-gillian-lieberman");
}

const canonical = `${ORIGIN}/episodes/${episode.id}`;
const episodePath = `episodes/${episode.id}/index.html`;
const episodeHtml = read(episodePath);
const sitemap = read("sitemap.xml");
const videoSitemap = read("video-sitemap.xml");
const relatedGuests = (episode.guestIds || []).map(guestById).filter(Boolean);

const checks = [];
const check = (label, condition, detail = "") => checks.push({ label, ok: Boolean(condition), detail });

check("Canonical episode page exists", Boolean(episodeHtml), episodePath);
check("Canonical tag matches permanent URL", episodeHtml.includes(`<link rel="canonical" href="${canonical}">`), canonical);
check("Verified YouTube master is on the page", episodeHtml.includes(episode.videoId), episode.videoId);
check("VideoObject structured data exists", episodeHtml.includes('"@type":"VideoObject"') || episodeHtml.includes('"@type": "VideoObject"'));
check("Breadcrumb structured data exists", episodeHtml.includes('"@type":"BreadcrumbList"') || episodeHtml.includes('"@type": "BreadcrumbList"'));
check("Static episode overview exists for crawlers", episodeHtml.includes("data-static-episode-overview"));
check("Standard sitemap includes canonical episode", sitemap.includes(`<loc>${canonical}</loc>`));
check("Video sitemap includes canonical episode", videoSitemap.includes(`<loc>${canonical}</loc>`));
check("Video sitemap includes verified YouTube ID", videoSitemap.includes(episode.videoId));

for (const guest of relatedGuests) {
  const guestPath = `guests/${guest.id}/index.html`;
  const guestHtml = read(guestPath);
  const guestCanonical = `${ORIGIN}/guests/${guest.id}`;
  check(`Guest profile exists: ${guest.name}`, Boolean(guestHtml), guestPath);
  check(`Guest profile is canonical: ${guest.name}`, guestHtml.includes(`<link rel="canonical" href="${guestCanonical}">`), guestCanonical);
  check(`Guest profile links to episode: ${guest.name}`, guestHtml.includes(`/episodes/${episode.id}`), canonical);
  check(`Standard sitemap includes guest: ${guest.name}`, sitemap.includes(`<loc>${guestCanonical}</loc>`), guestCanonical);
}

const failures = checks.filter(item => !item.ok);

console.log("");
console.log("THE ALANA SHOW — RELEASE READINESS");
console.log("==================================");
console.log(`Episode: ${episode.title}`);
console.log(`Canonical: ${canonical}`);
console.log(`YouTube: https://www.youtube.com/watch?v=${episode.videoId}`);
console.log("");
console.log("OWNED-MEDIA CHECKS");
for (const item of checks) {
  console.log(`  ${item.ok ? "PASS" : "FAIL"}  ${item.label}${item.detail ? ` — ${item.detail}` : ""}`);
}

console.log("");
console.log("HUMAN / PLATFORM RELEASE CHECKLIST");
for (const item of [
  "Searchable YouTube title is final and accurate.",
  "YouTube description is final, includes the permanent episode URL, and uses natural searchable language.",
  "Custom thumbnail is final; use YouTube A/B testing when available and appropriate.",
  "Transcript has been reviewed and transcript-derived chapters are added.",
  "5–8 transcript-derived Shorts opportunities have been selected and each Short points viewers back to the full conversation.",
  "Episode is placed in the most relevant YouTube playlist.",
  "Intentional YouTube end screen is configured.",
  "Guest / organization sharing package has been sent with the permanent website URL.",
  "Search Console live test/index request is used after a substantive new or updated canonical release—not repeatedly without changes.",
  "Any sponsor or commercial relationship is disclosed clearly and remains separate from editorial judgment."
]) {
  console.log(`  [ ] ${item}`);
}

console.log("");
console.log("ORGANIC GROWTH PRINCIPLE");
console.log("  Build discovery through useful content, accurate metadata, real sharing, internal links, guest amplification, and long-tail search—not artificial traffic or spam.");
console.log("");

if (failures.length) {
  console.error(`Release readiness failed: ${failures.length} owned-media check${failures.length === 1 ? "" : "s"} need attention.`);
  process.exit(1);
}
console.log("Owned-media release checks passed. Platform checklist remains for final human review.");
