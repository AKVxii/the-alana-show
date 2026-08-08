import fs from 'node:fs';
import path from 'node:path';

const ORIGIN = 'https://thealanashow.com';
const errors = [];
const topics = [
  ['leadership', 'Leadership'],
  ['community', 'Community'],
  ['business', 'Business'],
  ['public-service', 'Public Service'],
  ['faith-purpose', 'Faith & Purpose'],
  ['wellness', 'Wellness'],
  ['technology', 'Technology'],
  ['stepping-up', 'Stepping Up']
];

const read = file => {
  if (!fs.existsSync(file)) {
    errors.push(`Missing required file: ${file}`);
    return '';
  }
  return fs.readFileSync(file, 'utf8');
};
const assert = (condition, message) => { if (!condition) errors.push(message); };
const sitemap = read('sitemap.xml');
const topicData = read('src/data/topic-pages.js');
const topicHub = read('src/topics-page.js');
const detailRenderer = read('src/topic-detail.js');

assert(topicHub.includes('topicHref(topic)'), 'Topics hub must route cards through topicHref().');
assert(topicData.includes('2026 Candidates Special') && topicData.includes('/specials/'), 'Candidates Special must continue to route to /specials/.');
assert(detailRenderer.includes('/api/youtube'), 'Topic detail renderer must hydrate from the live conversation feed.');
assert(detailRenderer.includes('categories.includes(topic.name)'), 'Topic detail renderer must filter episodes by the verified topic name.');

for (const [id, name] of topics) {
  const file = `topics/${id}/index.html`;
  const html = read(file);
  const canonical = `${ORIGIN}/topics/${id}`;

  assert(sitemap.includes(`<loc>${canonical}</loc>`), `Sitemap is missing ${canonical}.`);
  assert(topicData.includes(`id: "${id}"`) && topicData.includes(`name: "${name}"`), `Topic data is missing ${name} (${id}).`);
  assert(html.includes(`<link rel="canonical" href="${canonical}">`), `${file}: canonical must equal ${canonical}.`);
  assert(/<title>[^<]+The Alana Show<\/title>/i.test(html), `${file}: missing branded title.`);
  assert(/<meta name="description" content="[^"]+"/i.test(html), `${file}: missing meta description.`);
  assert(html.includes(`<meta property="og:url" content="${canonical}">`), `${file}: og:url must equal canonical.`);
  assert(html.includes('name="twitter:card" content="summary_large_image"'), `${file}: missing Twitter large-card metadata.`);
  assert(/"@type":"CollectionPage"/.test(html), `${file}: missing CollectionPage structured data.`);
  assert(/"@type":"BreadcrumbList"/.test(html), `${file}: missing BreadcrumbList structured data.`);
  assert(html.includes(`data-topic-id="${id}"`), `${file}: missing matching data-topic-id.`);
  assert(html.includes('document.documentElement.classList.add("js-enabled")'), `${file}: missing pre-paint JS marker.`);
  assert(html.includes('.js-enabled .static-crawl-fallback{display:none}'), `${file}: crawl fallback can flash before hydration.`);
  assert(html.includes('class="static-crawl-fallback"'), `${file}: missing static crawl fallback.`);

  const detailLinks = [...html.matchAll(/href="(\/episodes\/[^"?]+)"/g)].map(match => match[1]);
  assert(detailLinks.length >= 1, `${file}: needs at least one direct episode discovery link.`);
  for (const href of detailLinks) {
    const slug = href.replace(/^\/episodes\//, '').replace(/\/$/, '');
    assert(fs.existsSync(path.join('episodes', slug, 'index.html')), `${file}: linked episode does not exist: ${href}.`);
  }
}

if (errors.length) {
  console.error(`\nTopic authority gate failed with ${errors.length} issue${errors.length === 1 ? '' : 's'}:\n`);
  errors.forEach(error => console.error(`  - ${error}`));
  process.exit(1);
}

console.log('Topic authority gate passed.');
console.log(`  Permanent topic pages: ${topics.length}`);
console.log('  Metadata, schema, sitemap coverage and crawl fallbacks: OK');
