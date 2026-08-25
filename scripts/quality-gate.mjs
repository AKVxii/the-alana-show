import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const ORIGIN = 'https://thealanashow.com';
const FORBIDDEN_ORIGIN = 'https://www.' + 'thealanashow.com';
const errors = [];

const assert = (condition, message) => {
  if (!condition) errors.push(message);
};

const read = (relativePath) => {
  const absolutePath = path.join(ROOT, relativePath);
  if (!fs.existsSync(absolutePath)) {
    errors.push(`Missing required file: ${relativePath}`);
    return '';
  }
  return fs.readFileSync(absolutePath, 'utf8');
};

const getAttribute = (tag, name) => {
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const match = tag.match(new RegExp(`\\b${escaped}\\s*=\\s*(["'])(.*?)\\1`, 'i'));
  return match?.[2] ?? null;
};

const getMeta = (html, key) => {
  const tags = html.match(/<meta\b[^>]*>/gi) ?? [];
  const tag = tags.find((candidate) => getAttribute(candidate, 'name') === key || getAttribute(candidate, 'property') === key);
  return tag ? getAttribute(tag, 'content') : null;
};

const getCanonical = (html) => {
  const tags = html.match(/<link\b[^>]*>/gi) ?? [];
  const tag = tags.find((candidate) => (getAttribute(candidate, 'rel') ?? '').split(/\s+/).includes('canonical'));
  return tag ? getAttribute(tag, 'href') : null;
};

const getTitle = (html) => html.match(/<title>([\s\S]*?)<\/title>/i)?.[1]?.trim() ?? '';

const getAnchors = (html) => new Set(
  (html.match(/<a\b[^>]*>/gi) ?? [])
    .map((tag) => getAttribute(tag, 'href'))
    .filter(Boolean),
);

const urlToFile = (url) => {
  const pathname = new URL(url).pathname;
  return pathname === '/' ? 'index.html' : `${pathname.replace(/^\//, '')}/index.html`;
};

const sitemap = read('sitemap.xml');
const robots = read('robots.txt');
const sitemapUrls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1].trim());
const sitemapSet = new Set(sitemapUrls);

assert(sitemap.includes('<urlset'), 'sitemap.xml is missing its <urlset> root.');
assert(sitemapUrls.length >= 60, `Sitemap unexpectedly contains only ${sitemapUrls.length} URLs; expected at least 60.`);
assert(sitemapSet.size === sitemapUrls.length, 'Sitemap contains duplicate URLs.');

const requiredRoutes = ['/', '/episodes', '/guests', '/topics', '/specials', '/south-florida', '/book', '/advertise'];
for (const route of requiredRoutes) {
  assert(sitemapSet.has(`${ORIGIN}${route}`), `Sitemap is missing required route: ${route}`);
}

for (const url of sitemapUrls) {
  assert(url === `${ORIGIN}/` || url.startsWith(`${ORIGIN}/`), `Sitemap URL uses the wrong canonical host: ${url}`);
  assert(!url.startsWith(FORBIDDEN_ORIGIN), `Sitemap URL uses forbidden www host: ${url}`);

  const relativeFile = urlToFile(url);
  const html = read(relativeFile);
  if (!html) continue;

  assert(Boolean(getTitle(html)), `${relativeFile}: missing <title>.`);
  assert(Boolean(getMeta(html, 'description')), `${relativeFile}: missing meta description.`);
  assert(getCanonical(html) === url, `${relativeFile}: canonical must equal ${url}; found ${getCanonical(html) ?? 'none'}.`);

  const pathname = new URL(url).pathname;
  const detailMatch = pathname.match(/^\/(episodes|guests)\/([^/]+)$/);
  if (!detailMatch) continue;

  const [, detailType, slug] = detailMatch;
  const expectedType = detailType === 'episodes' ? 'episode' : 'guest';

  assert(getMeta(html, 'og:url') === url, `${relativeFile}: og:url must equal ${url}.`);
  assert(Boolean(getMeta(html, 'og:title')), `${relativeFile}: missing og:title.`);
  assert(Boolean(getMeta(html, 'og:description')), `${relativeFile}: missing og:description.`);
  assert(/^https:\/\//.test(getMeta(html, 'og:image') ?? ''), `${relativeFile}: missing absolute og:image.`);
  assert(getMeta(html, 'twitter:card') === 'summary_large_image', `${relativeFile}: twitter:card must be summary_large_image.`);
  assert(Boolean(getMeta(html, 'twitter:title')), `${relativeFile}: missing twitter:title.`);
  assert(Boolean(getMeta(html, 'twitter:description')), `${relativeFile}: missing twitter:description.`);
  assert(/^https:\/\//.test(getMeta(html, 'twitter:image') ?? ''), `${relativeFile}: missing absolute twitter:image.`);
  assert(new RegExp(`data-detail-type=["']${expectedType}["']`, 'i').test(html), `${relativeFile}: wrong or missing data-detail-type.`);
  assert(new RegExp(`data-detail-id=["']${slug}["']`, 'i').test(html), `${relativeFile}: wrong or missing data-detail-id.`);

  if (detailType === 'guests') {
    assert(/"@type"\s*:\s*"ProfilePage"/.test(html), `${relativeFile}: guest shell is missing ProfilePage structured data.`);
    assert(/"@type"\s*:\s*"Person"/.test(html), `${relativeFile}: guest shell is missing Person structured data.`);
  }
}

const episodeUrls = sitemapUrls.filter((url) => /^\/episodes\/[^/]+$/.test(new URL(url).pathname));
const guestUrls = sitemapUrls.filter((url) => /^\/guests\/[^/]+$/.test(new URL(url).pathname));
assert(episodeUrls.length >= 25, `Sitemap contains only ${episodeUrls.length} episode detail URLs; expected at least 25.`);
assert(guestUrls.length >= 30, `Sitemap contains only ${guestUrls.length} guest detail URLs; expected at least 30.`);

const detailPathsOnDisk = (section) => {
  const directory = path.join(ROOT, section);
  if (!fs.existsSync(directory)) return new Set();
  return new Set(
    fs.readdirSync(directory, { withFileTypes: true })
      .filter((entry) => entry.isDirectory() && fs.existsSync(path.join(directory, entry.name, 'index.html')))
      .map((entry) => `/${section}/${entry.name}`),
  );
};

for (const [section, urls] of [['episodes', episodeUrls], ['guests', guestUrls]]) {
  const diskPaths = detailPathsOnDisk(section);
  const sitemapPaths = new Set(urls.map((url) => new URL(url).pathname));

  for (const diskPath of diskPaths) {
    assert(sitemapPaths.has(diskPath), `${diskPath}/index.html exists but is missing from sitemap.xml.`);
  }
  for (const sitemapPath of sitemapPaths) {
    assert(diskPaths.has(sitemapPath), `${sitemapPath} is in sitemap.xml but its index.html is missing.`);
  }
}

const episodesHub = read('episodes/index.html');
const guestsHub = read('guests/index.html');
const episodeAnchors = getAnchors(episodesHub);
const guestAnchors = getAnchors(guestsHub);

for (const url of episodeUrls) {
  const pathname = new URL(url).pathname;
  assert(episodeAnchors.has(pathname), `episodes/index.html crawl fallback is missing ${pathname}.`);
}
for (const url of guestUrls) {
  const pathname = new URL(url).pathname;
  assert(guestAnchors.has(pathname), `guests/index.html crawl fallback is missing ${pathname}.`);
}

for (const [file, html] of [['episodes/index.html', episodesHub], ['guests/index.html', guestsHub]]) {
  assert(!/document\.documentElement\.classList\.add\(["']js-enabled["']\)/.test(html), `${file}: must not hide content before its module loads.`);
  assert(!/\.js-enabled\s+\.static-crawl-fallback\s*\{[^}]*display\s*:\s*none/i.test(html), `${file}: crawl fallback must remain visible until enhanced rendering replaces it.`);
  assert(/<div id="app">[\s\S]*?<main id="main-content" class="[^"]*\bstatic-crawl-fallback\b/i.test(html), `${file}: missing visible first-paint content inside #app.`);
}

assert(/User-agent:\s*\*/i.test(robots), 'robots.txt is missing the wildcard user-agent block.');
assert(/Allow:\s*\//i.test(robots), 'robots.txt does not explicitly allow crawling.');
assert(!/Disallow:\s*\/\s*$/im.test(robots), 'robots.txt blocks the entire site.');
assert(robots.includes(`Sitemap: ${ORIGIN}/sitemap.xml`), 'robots.txt points to the wrong sitemap URL.');

const homepage = read('index.html');
assert(/"@type"\s*:\s*"WebSite"/.test(homepage), 'Homepage is missing WebSite structured data.');
assert(/"@type"\s*:\s*"Person"/.test(homepage), 'Homepage is missing Alana K. Vandeveer Person structured data.');

const textExtensions = new Set(['.html', '.js', '.mjs', '.xml', '.txt', '.json', '.webmanifest']);
const ignoredDirectories = new Set(['.git', '.vercel', 'node_modules']);

const scanForForbiddenHost = (directory) => {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    if (entry.isDirectory() && ignoredDirectories.has(entry.name)) continue;
    const absolutePath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      scanForForbiddenHost(absolutePath);
      continue;
    }
    if (!textExtensions.has(path.extname(entry.name))) continue;
    const content = fs.readFileSync(absolutePath, 'utf8');
    if (content.includes(FORBIDDEN_ORIGIN)) {
      errors.push(`${path.relative(ROOT, absolutePath)} contains forbidden canonical host ${FORBIDDEN_ORIGIN}.`);
    }
  }
};

scanForForbiddenHost(ROOT);

if (errors.length) {
  console.error(`\nSite quality gate failed with ${errors.length} issue${errors.length === 1 ? '' : 's'}:\n`);
  for (const error of errors) console.error(`  - ${error}`);
  console.error('\nFix the issues above before merging.\n');
  process.exit(1);
}

console.log('Site quality gate passed.');
console.log(`  Sitemap URLs: ${sitemapUrls.length}`);
console.log(`  Episode detail pages: ${episodeUrls.length}`);
console.log(`  Guest detail pages: ${guestUrls.length}`);
console.log('  Canonicals, metadata, crawl fallbacks, robots and host consistency: OK');
