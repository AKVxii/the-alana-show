import fs from 'node:fs';

const errors = [];
const read = file => {
  if (!fs.existsSync(file)) {
    errors.push(`Missing required file: ${file}`);
    return '';
  }
  return fs.readFileSync(file, 'utf8');
};
const assert = (condition, message) => { if (!condition) errors.push(message); };

const measurement = read('src/lib/measurement.js');
const header = read('src/components/Header.js');
const mediaHeader = read('src/components/MediaHeader.js');
const main = read('src/main.js');
const episodesPage = read('src/episodes-page.js');
const newsletter = read('src/newsletter.js');
const broadcast = read('src/components/BroadcastReach.js');
const index = read('index.html');

assert(measurement.includes('window.vaq'), 'Measurement foundation must use the Vercel Analytics queue contract.');
assert(measurement.includes('setupMeasurement'), 'Measurement foundation must export setupMeasurement().');
assert(measurement.includes('trackEvent'), 'Measurement foundation must export trackEvent().');
assert(measurement.includes('MAX_EVENT_PROPERTIES = 2'), 'Custom-event payloads must stay within the Pro two-property limit.');
assert(measurement.includes('.slice(0, MAX_EVENT_PROPERTIES)'), 'Measurement payloads must enforce the two-property limit.');

for (const eventName of [
  'Episode Open',
  'Guest Open',
  'Topic Open',
  'Watch Outbound',
  'Listen Outbound',
  'Partnership Explore',
  'Contact Form Attempt',
  'Search Query',
  'Search Filter',
  'Archive Search',
  'Archive Topic Filter',
  'Archive Load More',
  'Newsletter Attempt',
  'Newsletter Success',
  'Newsletter Failure',
  'Contact Form Success',
  'Contact Form Failure',
  'Broadcast Listen',
  'Broadcast Episodes'
]) {
  const sources = [measurement, main, episodesPage, newsletter, broadcast];
  assert(sources.some(source => source.includes(`"${eventName}"`)), `Measurement taxonomy is missing ${eventName}.`);
}

for (const sensitiveField of ['data.name', 'data.email', 'data.phone', 'data.message', 'organization.value', 'website.value']) {
  assert(!measurement.includes(sensitiveField), `Measurement code must not collect personal field data: ${sensitiveField}.`);
}
assert(!main.includes('trackEvent("Search Query", { query:'), 'Homepage search must not transmit raw search text.');
assert(!episodesPage.includes('trackEvent("Archive Search", { query:'), 'Archive search must not transmit raw search text.');
assert(!newsletter.includes('trackEvent("Newsletter Success", { email:'), 'Newsletter measurement must not transmit email addresses.');

assert(header.includes('setupMeasurement();'), 'Homepage header must initialize measurement.');
assert(mediaHeader.includes('setupMeasurement();'), 'Subpage header must initialize measurement.');
assert(main.includes('setupNewsletter();'), 'Homepage must bind the already-rendered newsletter deterministically.');
assert(newsletter.includes('export function setupNewsletter'), 'Newsletter module must expose deterministic setup.');
assert(!newsletter.includes('requestAnimationFrame(() => mountNewsletter'), 'Newsletter setup must not use retry-frame mounting.');
assert(!index.includes('src="/src/newsletter.js"'), 'Homepage must not load a redundant newsletter bootstrap module.');
assert(broadcast.includes('data-track-exclusive="true"'), 'Broadcast CTA measurement must avoid duplicate outbound events.');

if (errors.length) {
  console.error(`\nMeasurement gate failed with ${errors.length} issue${errors.length === 1 ? '' : 's'}:\n`);
  errors.forEach(error => console.error(`  - ${error}`));
  process.exit(1);
}

console.log('Measurement gate passed.');
console.log('  Privacy-safe event taxonomy: OK');
console.log('  Two-property custom-event cap: OK');
console.log('  Search queries remain private: OK');
console.log('  Deterministic newsletter binding: OK');
console.log('  Homepage and subpage initialization: OK');
