import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const ORIGIN = 'https://thealanashow.com';
const errors = [];

const read = relativePath => {
  const absolute = path.join(ROOT, relativePath);
  if (!fs.existsSync(absolute)) {
    errors.push(`Missing required file: ${relativePath}`);
    return '';
  }
  return fs.readFileSync(absolute, 'utf8');
};

const assert = (condition, message) => {
  if (!condition) errors.push(message);
};

const detail = read('src/detail-page.js');
const main = read('src/main.js');
const guestsPage = read('src/guests-page.js');
const topicsPage = read('src/topics-page.js');
const topicDetail = read('src/topic-detail.js');
const topicPages = read('src/data/topic-pages.js');
const sitemap = read('sitemap.xml');

assert(detail.includes('topicHref(category)'), 'Episode topic links must use canonical topic authority URLs.');
assert(!detail.includes('href="/episodes?topic=${encodeURIComponent(category)}"'), 'Episode detail must not use archive-filter URLs as its primary topic links.');
assert(detail.includes('"@type": "VideoObject"'), 'Episode detail must retain VideoObject structured data.');
assert(detail.includes('"@type": "PodcastSeries"'), 'Episode detail must connect videos to The Alana Show series.');
assert(detail.includes('about: relatedGuests.map'), 'Episode VideoObject must connect to verified guest entities.');
assert(detail.includes('isPartOf: { "@id": SHOW_ID }'), 'Episode VideoObject must connect to the show entity.');
assert(detail.includes('loadYouTubeFeed'), 'Episode detail must reuse the shared YouTube feed cache.');
assert(!detail.includes('fetch("/api/youtube")'), 'Episode detail must not bypass the shared YouTube feed cache.');

for (const [file, source] of [
  ['src/guests-page.js', guestsPage],
  ['src/topics-page.js', topicsPage],
  ['src/topic-detail.js', topicDetail]
]) {
  assert(source.includes('loadYouTubeFeed'), `${file} must reuse the shared YouTube feed cache.`);
  assert(!source.includes('fetch("/api/youtube"'), `${file} must not bypass the shared YouTube feed cache.`);
}

assert(main.includes('const resultUrl = episode.detailPath || youtubeUrl;'), 'Homepage search must prefer internal verified episode pages.');
assert(main.includes('trackEvent("Search Open"'), 'Homepage search-open intent must be measurable.');
assert(main.includes('clearTimeout(measureTimer);\n    const category ='), 'Category selection must cancel the pending search debounce event.');
assert(main.includes('const queryLength = lengthBucket(input.value);'), 'Search measurement must snapshot the query-length bucket before debounce.');

const topicIds = [...topicPages.matchAll(/\bid:\s*"([a-z0-9-]+)"/g)].map(match => match[1]);
assert(topicIds.length >= 8, `Expected at least 8 permanent topic authority pages; found ${topicIds.length}.`);

for (const id of topicIds) {
  const file = `topics/${id}/index.html`;
  const html = read(file);
  if (!html) continue;
  const canonical = `${ORIGIN}/topics/${id}`;
  assert(html.includes(`<link rel="canonical" href="${canonical}">`), `${file} must use its permanent canonical URL.`);
  assert(html.includes('"@type":"CollectionPage"'), `${file} must retain CollectionPage structured data.`);
  assert(html.includes('"@type":"BreadcrumbList"'), `${file} must retain breadcrumb structured data.`);
  assert(sitemap.includes(`<loc>${canonical}</loc>`), `${file} must be represented in sitemap.xml.`);
}

if (errors.length) {
  console.error(`\nAuthority gate failed with ${errors.length} issue${errors.length === 1 ? '' : 's'}:\n`);
  errors.forEach(error => console.error(`  - ${error}`));
  process.exit(1);
}

console.log('Search authority gate passed.');
console.log(`  Permanent topic authority pages: ${topicIds.length}`);
console.log('  Canonical topic links, entity graph, internal search links and shared feed caching: OK');
