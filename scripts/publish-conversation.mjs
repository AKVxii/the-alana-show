import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const ROOT = process.cwd();
const ORIGIN = "https://thealanashow.com";
const DEFAULT_SOCIAL_IMAGE = `${ORIGIN}/assets/alana-show-social-card-2026-imessage-v2.png`;
const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const skipChecks = args.includes("--skip-checks");
const inputArg = args.find(arg => !arg.startsWith("--")) || "content/conversation.json";
const inputPath = path.resolve(ROOT, inputArg);

const fail = message => {
  console.error(`\nPublish aborted: ${message}\n`);
  process.exit(1);
};

const read = relative => fs.readFileSync(path.join(ROOT, relative), "utf8");
const escapeHtml = value => String(value).replace(/[&<>"']/g, char => ({
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#039;"
})[char]);
const jsString = value => JSON.stringify(String(value));
const regexEscape = value => String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const slugify = value => String(value)
  .normalize("NFKD")
  .replace(/[\u0300-\u036f]/g, "")
  .toLowerCase()
  .replace(/['’]/g, "")
  .replace(/[^a-z0-9]+/g, "-")
  .replace(/^-+|-+$/g, "")
  .replace(/-{2,}/g, "-");
const safeJsonLd = value => JSON.stringify(value).replace(/</g, "\\u003c");

if (!fs.existsSync(inputPath)) fail(`Input file not found: ${path.relative(ROOT, inputPath)}`);

const gitStatus = spawnSync("git", ["status", "--porcelain"], { cwd: ROOT, encoding: "utf8" });
if (gitStatus.status !== 0) fail("Unable to verify Git working-tree state.");
if (gitStatus.stdout.trim()) fail("Working tree is not clean. Commit, stash, or discard unrelated changes before publishing.");

let input;
try {
  input = JSON.parse(fs.readFileSync(inputPath, "utf8"));
} catch (error) {
  fail(`Input JSON could not be parsed: ${error.message}`);
}

const videoId = String(input.videoId || "").trim();
const slug = String(input.slug || slugify(input.title || "")).trim();
const rawGuests = Array.isArray(input.guests) ? input.guests : [];
const guests = rawGuests.map(guest => {
  const record = typeof guest === "string" ? { name: guest } : guest;
  const name = String(record?.name || "").trim();
  return { name, slug: String(record?.slug || slugify(name)).trim() };
});

if (!/^[A-Za-z0-9_-]{11}$/.test(videoId)) fail("videoId must be an 11-character YouTube video ID.");
if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) fail("slug must contain only lowercase letters, numbers, and hyphens.");
if (!guests.length || guests.some(guest => !guest.name || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(guest.slug))) {
  fail("Provide at least one guest with a name and a valid lowercase slug.");
}
if (new Set(guests.map(guest => guest.slug)).size !== guests.length) fail("Guest slugs must be unique within the conversation record.");

const guestNames = guests.map(guest => guest.name);
const title = String(input.title || `Conversation with ${guestNames.join(" & ")}`).trim();
const description = String(input.description || `Watch The Alana Show conversation with ${guestNames.join(" and ")}.`).replace(/\s+/g, " ").trim();
if (!title) fail("title cannot be empty.");
if (!description) fail("description cannot be empty.");

const catalogPath = "src/data/catalog.js";
const episodeHubPath = "episodes/index.html";
const guestHubPath = "guests/index.html";
const sitemapPath = "sitemap.xml";
let catalog = read(catalogPath);
let episodeHub = read(episodeHubPath);
let guestHub = read(guestHubPath);
let sitemap = read(sitemapPath);

function arrayBounds(source, exportName) {
  const marker = `export const ${exportName} = [`;
  const start = source.indexOf(marker);
  if (start < 0) fail(`Could not find ${exportName} array in catalog.js.`);
  const bodyStart = start + marker.length;
  const end = source.indexOf("\n];", bodyStart);
  if (end < 0) fail(`Could not find end of ${exportName} array in catalog.js.`);
  return { bodyStart, end, body: source.slice(bodyStart, end) };
}

function appendArrayRecord(source, exportName, record) {
  const { end } = arrayBounds(source, exportName);
  return `${source.slice(0, end)}\n${record}${source.slice(end)}`;
}

const episodeSection = arrayBounds(catalog, "episodes").body;
if (new RegExp(`\\bid:\\s*${regexEscape(jsString(slug))}`).test(episodeSection)) fail(`Episode slug already exists: ${slug}`);
if (new RegExp(`\\bvideoId:\\s*${regexEscape(jsString(videoId))}`).test(episodeSection)) fail(`YouTube video ID is already in the verified catalog: ${videoId}`);

const newGuestPages = [];
for (const guest of guests) {
  const bounds = arrayBounds(catalog, "guests");
  const linePattern = new RegExp(`^\\s*\\{[^\\n]*\\bid:\\s*${regexEscape(jsString(guest.slug))}[^\\n]*\\},?\\s*$`, "m");
  const match = bounds.body.match(linePattern);

  if (match) {
    const line = match[0];
    const nameMatch = line.match(/\\bname:\\s*("(?:[^"\\\\]|\\\\.)*")/);
    const existingName = nameMatch ? JSON.parse(nameMatch[1]) : "";
    if (existingName && existingName !== guest.name) {
      fail(`Guest slug ${guest.slug} already belongs to “${existingName}”. Supply the verified existing slug or a different new slug.`);
    }
    const idsMatch = line.match(/episodeIds:\s*\[([^\]]*)\]/);
    if (!idsMatch) fail(`Guest record ${guest.slug} is missing episodeIds.`);
    const ids = [...idsMatch[1].matchAll(/"([^"]+)"/g)].map(item => item[1]);
    if (!ids.includes(slug)) ids.push(slug);
    let replacement = line.replace(/episodeIds:\s*\[[^\]]*\]/, `episodeIds: [${ids.map(jsString).join(", ")}]`);
    replacement = replacement.replace(/conversationCount:\s*\d+/, `conversationCount: ${ids.length}`);
    catalog = catalog.replace(line, replacement);
  } else {
    const guestRecord = `  { id: ${jsString(guest.slug)}, name: ${jsString(guest.name)}, episodeIds: [${jsString(slug)}], conversationCount: 1 },`;
    catalog = appendArrayRecord(catalog, "guests", guestRecord);
    newGuestPages.push(guest);
  }
}

const episodeRecord = `  { id: ${jsString(slug)}, videoId: ${jsString(videoId)}, title: ${jsString(title)}, guestIds: [${guests.map(guest => jsString(guest.slug)).join(", ")}], detailPath: ${jsString(`/episodes/${slug}/`)} },`;
catalog = appendArrayRecord(catalog, "episodes", episodeRecord);

function insertCrawlLink(html, href, label) {
  if (html.includes(`href="${href}"`)) return html;
  const fallbackIndex = html.indexOf('class="static-crawl-fallback"');
  if (fallbackIndex < 0) fail("Could not find static crawl fallback container.");
  const listStart = html.indexOf("<ul", fallbackIndex);
  if (listStart < 0) fail("Could not find crawl fallback list.");
  const listTagEnd = html.indexOf(">", listStart);
  if (listTagEnd < 0) fail("Crawl fallback list markup is incomplete.");
  const item = `<li><a href="${escapeHtml(href)}">${escapeHtml(label)}</a></li>`;
  return `${html.slice(0, listTagEnd + 1)}${item}${html.slice(listTagEnd + 1)}`;
}

episodeHub = insertCrawlLink(episodeHub, `/episodes/${slug}`, title);
for (const guest of newGuestPages) guestHub = insertCrawlLink(guestHub, `/guests/${guest.slug}`, guest.name);

function insertSitemapUrl(xml, canonical, priority) {
  if (xml.includes(`<loc>${canonical}</loc>`)) return xml;
  const entry = `  <url><loc>${canonical}</loc><changefreq>monthly</changefreq><priority>${priority}</priority></url>\n`;
  if (!xml.includes("</urlset>")) fail("sitemap.xml is missing </urlset>.");
  return xml.replace("</urlset>", `${entry}</urlset>`);
}

sitemap = insertSitemapUrl(sitemap, `${ORIGIN}/episodes/${slug}`, "0.8");
for (const guest of newGuestPages) sitemap = insertSitemapUrl(sitemap, `${ORIGIN}/guests/${guest.slug}`, "0.7");

const episodeCanonical = `${ORIGIN}/episodes/${slug}`;
const episodeImage = `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`;
const episodeTitle = `${title} | The Alana Show`;
const episodeHtml = `<!doctype html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="description" content="${escapeHtml(description)}"><meta name="robots" content="index,follow,max-image-preview:large"><meta name="theme-color" content="#030914"><meta property="og:site_name" content="The Alana Show"><meta property="og:title" content="${escapeHtml(episodeTitle)}"><meta property="og:description" content="${escapeHtml(description)}"><meta property="og:type" content="video.other"><meta property="og:url" content="${episodeCanonical}"><meta property="og:image" content="${episodeImage}"><meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="${escapeHtml(episodeTitle)}"><meta name="twitter:description" content="${escapeHtml(description)}"><meta name="twitter:image" content="${episodeImage}"><title>${escapeHtml(episodeTitle)}</title><link rel="canonical" href="${episodeCanonical}"><link rel="icon" href="/assets/favicon.svg" type="image/svg+xml"><link rel="stylesheet" href="/src/styles.css"><link rel="stylesheet" href="/src/media.css"></head><body data-detail-type="episode" data-detail-id="${escapeHtml(slug)}"><a class="skip-link" href="#main-content">Skip to main content</a><div id="app"></div><script type="module" src="/src/detail-page.js"></script></body></html>`;

const guestFiles = newGuestPages.map(guest => {
  const canonical = `${ORIGIN}/guests/${guest.slug}`;
  const pageTitle = `${guest.name} | Guest | The Alana Show`;
  const guestDescription = `Explore verified conversations featuring ${guest.name} on The Alana Show.`;
  const structuredData = safeJsonLd({
    "@context": "https://schema.org",
    "@type": "ProfilePage",
    url: canonical,
    mainEntity: { "@type": "Person", name: guest.name }
  });
  const html = `<!doctype html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="description" content="${escapeHtml(guestDescription)}"><meta name="robots" content="index,follow,max-image-preview:large"><meta name="theme-color" content="#030914"><meta property="og:site_name" content="The Alana Show"><meta property="og:title" content="${escapeHtml(pageTitle)}"><meta property="og:description" content="${escapeHtml(guestDescription)}"><meta property="og:type" content="profile"><meta property="og:url" content="${canonical}"><meta property="og:image" content="${DEFAULT_SOCIAL_IMAGE}"><meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="${escapeHtml(pageTitle)}"><meta name="twitter:description" content="${escapeHtml(guestDescription)}"><meta name="twitter:image" content="${DEFAULT_SOCIAL_IMAGE}"><title>${escapeHtml(pageTitle)}</title><link rel="canonical" href="${canonical}"><link rel="icon" href="/assets/favicon.svg" type="image/svg+xml"><link rel="stylesheet" href="/src/styles.css"><link rel="stylesheet" href="/src/media.css"><script type="application/ld+json">${structuredData}</script></head><body data-detail-type="guest" data-detail-id="${escapeHtml(guest.slug)}"><a class="skip-link" href="#main-content">Skip to main content</a><div id="app"></div><script type="module" src="/src/detail-page.js"></script></body></html>`;
  return { guest, html, relativePath: `guests/${guest.slug}/index.html` };
});

const episodeRelativePath = `episodes/${slug}/index.html`;
if (fs.existsSync(path.join(ROOT, episodeRelativePath))) fail(`${episodeRelativePath} already exists.`);
for (const file of guestFiles) {
  if (fs.existsSync(path.join(ROOT, file.relativePath))) fail(`${file.relativePath} already exists even though the guest is not in catalog.js.`);
}

const summary = [
  `Episode: ${title}`,
  `Slug: ${slug}`,
  `YouTube: ${videoId}`,
  `Guests: ${guests.map(guest => `${guest.name} (${guest.slug})`).join(", ")}`,
  `New guest pages: ${newGuestPages.length}`
];

if (dryRun) {
  console.log("\nDry run only — no files changed.\n");
  summary.forEach(line => console.log(`  ${line}`));
  process.exit(0);
}

const snapshots = new Map([
  [catalogPath, read(catalogPath)],
  [episodeHubPath, read(episodeHubPath)],
  [guestHubPath, read(guestHubPath)],
  [sitemapPath, read(sitemapPath)]
]);
const createdPaths = [episodeRelativePath, ...guestFiles.map(file => file.relativePath)];

function write(relative, content) {
  const absolute = path.join(ROOT, relative);
  fs.mkdirSync(path.dirname(absolute), { recursive: true });
  fs.writeFileSync(absolute, content);
}

function rollback() {
  for (const [relative, content] of snapshots) write(relative, content);
  for (const relative of createdPaths) {
    const absolute = path.join(ROOT, relative);
    if (fs.existsSync(absolute)) fs.rmSync(path.dirname(absolute), { recursive: true, force: true });
  }
}

try {
  write(catalogPath, catalog);
  write(episodeHubPath, episodeHub);
  write(guestHubPath, guestHub);
  write(sitemapPath, sitemap);
  write(episodeRelativePath, episodeHtml);
  guestFiles.forEach(file => write(file.relativePath, file.html));

  if (!skipChecks) {
    const npm = process.platform === "win32" ? "npm.cmd" : "npm";
    const result = spawnSync(npm, ["run", "quality"], { cwd: ROOT, stdio: "inherit" });
    if (result.status !== 0) {
      rollback();
      fail("Quality checks failed. Publishing changes were rolled back.");
    }
  }
} catch (error) {
  rollback();
  fail(`${error.message} Publishing changes were rolled back.`);
}

console.log("\nConversation publishing files are ready for review.\n");
summary.forEach(line => console.log(`  ${line}`));
console.log("\nReview the Git diff, preview on Vercel, and merge through the normal PR workflow.\n");
