import { execFileSync } from "node:child_process";

const ORIGIN = "https://thealanashow.com";
const HOST = "thealanashow.com";
const KEY = "d6de9758dfaf587648bb523027de210b";
const KEY_LOCATION = `${ORIGIN}/${KEY}.txt`;
const ENDPOINT = "https://api.indexnow.org/indexnow";
const MAX_URLS = 10_000;

function normalizeUrl(value) {
  try {
    const url = new URL(String(value || "").trim(), ORIGIN);
    if (url.origin !== ORIGIN) return null;
    url.hash = "";
    return url.href.replace(/\/$/, url.pathname === "/" ? "/" : "");
  } catch {
    return null;
  }
}

function canonicalForPath(file) {
  const normalized = String(file || "").replace(/\\/g, "/");
  if (normalized === "index.html") return `${ORIGIN}/`;
  if (!normalized.endsWith("/index.html")) return null;
  const route = normalized.slice(0, -"/index.html".length);
  if (!route || route.startsWith("api/") || route.startsWith("src/") || route.startsWith("scripts/") || route.startsWith("docs/")) return null;
  return `${ORIGIN}/${route}`;
}

function urlsFromExplicitInput() {
  const raw = process.env.INDEXNOW_URLS || "";
  if (!raw.trim()) return [];
  return raw
    .split(/[\n,]+/)
    .map(normalizeUrl)
    .filter(Boolean);
}

function changedFiles() {
  const before = String(process.env.INDEXNOW_BEFORE_SHA || "").trim();
  const after = String(process.env.INDEXNOW_AFTER_SHA || "HEAD").trim();
  if (!before || /^0+$/.test(before)) return [];
  try {
    const output = execFileSync("git", ["diff", "--name-only", before, after], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"]
    });
    return output.split(/\r?\n/).map(line => line.trim()).filter(Boolean);
  } catch (error) {
    console.warn(`IndexNow could not inspect changed files: ${error.message}`);
    return [];
  }
}

function urlsFromChangedFiles(files) {
  const urls = new Set();
  for (const file of files) {
    const canonical = canonicalForPath(file);
    if (canonical) urls.add(canonical);

    if (file === "src/data/catalog.js" || file === "sitemap.xml" || file === "video-sitemap.xml") {
      urls.add(`${ORIGIN}/episodes`);
      urls.add(`${ORIGIN}/guests`);
      urls.add(`${ORIGIN}/topics`);
    }

    if (file === "index.html" || file.startsWith("src/components/") || file === "src/main.js") {
      urls.add(`${ORIGIN}/`);
    }
  }
  return [...urls];
}

function uniqueValidUrls(values) {
  return [...new Set(values.map(normalizeUrl).filter(Boolean))].slice(0, MAX_URLS);
}

async function submit(urlList) {
  const dryRun = process.env.INDEXNOW_DRY_RUN === "1";
  if (dryRun) {
    console.log(`IndexNow dry run: ${urlList.length} URL${urlList.length === 1 ? "" : "s"} ready.`);
    urlList.forEach(url => console.log(`  - ${url}`));
    return;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15_000);
  try {
    const response = await fetch(ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "User-Agent": "TheAlanaShow-IndexNow/1.0"
      },
      body: JSON.stringify({ host: HOST, key: KEY, keyLocation: KEY_LOCATION, urlList }),
      signal: controller.signal
    });

    if (![200, 202].includes(response.status)) {
      const body = (await response.text()).slice(0, 300);
      throw new Error(`IndexNow returned HTTP ${response.status}${body ? `: ${body}` : ""}`);
    }

    console.log(`IndexNow accepted ${urlList.length} changed URL${urlList.length === 1 ? "" : "s"} (HTTP ${response.status}).`);
  } finally {
    clearTimeout(timeout);
  }
}

const explicit = urlsFromExplicitInput();
const files = explicit.length ? [] : changedFiles();
let urls = uniqueValidUrls(explicit.length ? explicit : urlsFromChangedFiles(files));

if (!urls.length) {
  console.log("IndexNow: no canonical page changes detected; nothing to submit.");
  process.exit(0);
}

await submit(urls);
