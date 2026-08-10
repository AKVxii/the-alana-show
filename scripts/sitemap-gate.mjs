import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const ORIGIN = "https://thealanashow.com";
const sitemapPath = path.join(ROOT, "sitemap.xml");
const failures = [];

const fail = message => failures.push(message);
const decodeXml = value => String(value)
  .replace(/&apos;/g, "'")
  .replace(/&quot;/g, '"')
  .replace(/&gt;/g, ">")
  .replace(/&lt;/g, "<")
  .replace(/&amp;/g, "&");

function localPathForUrl(rawUrl) {
  let url;
  try {
    url = new URL(rawUrl);
  } catch {
    fail(`Invalid URL: ${rawUrl}`);
    return "";
  }
  if (url.origin !== ORIGIN) fail(`Unexpected origin for ${rawUrl}`);
  if (url.search || url.hash) fail(`Query strings and hashes do not belong in the sitemap: ${rawUrl}`);
  const route = decodeURIComponent(url.pathname).replace(/^\/+|\/+$/g, "");
  return route ? `${route}/index.html` : "index.html";
}

if (!fs.existsSync(sitemapPath)) {
  console.error("Sitemap gate failed: sitemap.xml is missing.");
  process.exit(1);
}

const xml = fs.readFileSync(sitemapPath, "utf8");
if (/<priority>/i.test(xml)) fail("Remove <priority>; Google ignores it.");
if (/<changefreq>/i.test(xml)) fail("Remove <changefreq>; Google ignores it.");

const blocks = [...xml.matchAll(/<url>([\s\S]*?)<\/url>/g)].map(match => match[1]);
if (!blocks.length) fail("No <url> entries were found.");

const seen = new Set();
const today = new Date(`${new Date().toISOString().slice(0, 10)}T23:59:59Z`);
for (const block of blocks) {
  const locMatch = block.match(/<loc>([\s\S]*?)<\/loc>/i);
  if (!locMatch) {
    fail("A sitemap entry is missing <loc>.");
    continue;
  }
  const loc = decodeXml(locMatch[1].trim());
  if (seen.has(loc)) fail(`Duplicate URL: ${loc}`);
  seen.add(loc);

  const relative = localPathForUrl(loc);
  if (!relative) continue;
  const absolute = path.join(ROOT, relative);
  if (!fs.existsSync(absolute)) {
    fail(`Sitemap URL has no static page: ${loc} -> ${relative}`);
    continue;
  }

  const html = fs.readFileSync(absolute, "utf8");
  const canonicalMatch = html.match(/<link\s+rel="canonical"\s+href="([^"]+)"/i);
  if (!canonicalMatch) fail(`Static page is missing a canonical link: ${relative}`);
  else if (canonicalMatch[1] !== loc) fail(`Canonical mismatch for ${relative}: ${canonicalMatch[1]} != ${loc}`);

  const lastmods = [...block.matchAll(/<lastmod>([^<]+)<\/lastmod>/gi)].map(match => match[1].trim());
  if (lastmods.length > 1) fail(`Multiple <lastmod> values for ${loc}`);
  if (lastmods.length === 1) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(lastmods[0])) fail(`Use YYYY-MM-DD lastmod for ${loc}: ${lastmods[0]}`);
    else {
      const date = new Date(`${lastmods[0]}T00:00:00Z`);
      if (Number.isNaN(date.valueOf())) fail(`Invalid lastmod for ${loc}: ${lastmods[0]}`);
      else if (date > today) fail(`Future lastmod for ${loc}: ${lastmods[0]}`);
    }
  }
}

const locCount = [...xml.matchAll(/<loc>/g)].length;
if (locCount !== blocks.length) fail(`Expected one <loc> per <url>: ${locCount} loc tags for ${blocks.length} URL blocks.`);

if (failures.length) {
  console.error("Sitemap gate failed:");
  failures.forEach(message => console.error(`- ${message}`));
  process.exit(1);
}

console.log(`Sitemap gate passed: ${blocks.length} canonical static URLs, no ignored priority/changefreq noise.`);
