import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const ROOT = process.cwd();
const ORIGIN = "https://thealanashow.com";
const SITEMAP_PATH = path.join(ROOT, "sitemap.xml");
const TODAY = new Date().toISOString().slice(0, 10);

const fail = message => {
  console.error(`Sitemap sync failed: ${message}`);
  process.exit(1);
};

const xmlEscape = value => String(value)
  .replace(/&/g, "&amp;")
  .replace(/</g, "&lt;")
  .replace(/>/g, "&gt;")
  .replace(/"/g, "&quot;")
  .replace(/'/g, "&apos;");

function localPathForUrl(rawUrl) {
  let url;
  try {
    url = new URL(rawUrl);
  } catch {
    fail(`Invalid URL in sitemap: ${rawUrl}`);
  }
  if (url.origin !== ORIGIN) fail(`Unexpected sitemap origin: ${url.origin}`);
  if (url.search || url.hash) fail(`Sitemap URL must not include query or hash: ${rawUrl}`);
  const route = decodeURIComponent(url.pathname).replace(/^\/+|\/+$/g, "");
  return route ? `${route}/index.html` : "index.html";
}

function git(args) {
  return spawnSync("git", args, { cwd: ROOT, encoding: "utf8" });
}

function lastmodFor(relative) {
  const absolute = path.join(ROOT, relative);
  if (!fs.existsSync(absolute)) fail(`No static page exists for ${relative}`);

  const status = git(["status", "--porcelain", "--", relative]);
  if (status.status !== 0) fail(`Unable to inspect Git status for ${relative}`);
  if (status.stdout.trim()) return TODAY;

  const history = git(["log", "-1", "--format=%cI", "--", relative]);
  if (history.status !== 0) fail(`Unable to inspect Git history for ${relative}`);
  const stamp = history.stdout.trim();
  if (!stamp) return "";
  const parsed = new Date(stamp);
  if (Number.isNaN(parsed.valueOf())) fail(`Invalid Git date for ${relative}: ${stamp}`);
  return parsed.toISOString().slice(0, 10);
}

if (!fs.existsSync(SITEMAP_PATH)) fail("sitemap.xml was not found.");
const source = fs.readFileSync(SITEMAP_PATH, "utf8");
const urls = [...source.matchAll(/<loc>([^<]+)<\/loc>/g)].map(match => match[1].trim());
if (!urls.length) fail("sitemap.xml contains no URLs.");
if (new Set(urls).size !== urls.length) fail("sitemap.xml contains duplicate URLs.");

const entries = urls.map(url => {
  const relative = localPathForUrl(url);
  const lastmod = lastmodFor(relative);
  return `  <url>\n    <loc>${xmlEscape(url)}</loc>${lastmod ? `\n    <lastmod>${lastmod}</lastmod>` : ""}\n  </url>`;
});

const output = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries.join("\n")}\n</urlset>\n`;
fs.writeFileSync(SITEMAP_PATH, output);
console.log(`Sitemap freshness synced for ${entries.length} canonical URLs.`);
