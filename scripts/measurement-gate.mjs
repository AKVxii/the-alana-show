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

assert(measurement.includes('window.vaq'), 'Measurement foundation must use the Vercel Analytics queue contract.');
assert(measurement.includes('setupMeasurement'), 'Measurement foundation must export setupMeasurement().');
assert(measurement.includes('trackEvent'), 'Measurement foundation must export trackEvent().');
for (const eventName of ['Episode Open', 'Guest Open', 'Topic Open', 'Watch Outbound', 'Listen Outbound', 'Partnership Explore', 'Contact Form Attempt']) {
  assert(measurement.includes(`"${eventName}"`), `Measurement taxonomy is missing ${eventName}.`);
}
for (const sensitiveField of ['data.name', 'data.email', 'data.phone', 'data.message', 'organization.value', 'website.value']) {
  assert(!measurement.includes(sensitiveField), `Measurement code must not collect personal field data: ${sensitiveField}.`);
}
assert(header.includes('setupMeasurement();'), 'Homepage header must initialize measurement.');
assert(mediaHeader.includes('setupMeasurement();'), 'Subpage header must initialize measurement.');

if (errors.length) {
  console.error(`\nMeasurement gate failed with ${errors.length} issue${errors.length === 1 ? '' : 's'}:\n`);
  errors.forEach(error => console.error(`  - ${error}`));
  process.exit(1);
}

console.log('Measurement gate passed.');
console.log('  Privacy-safe event taxonomy: OK');
console.log('  Homepage and subpage initialization: OK');
console.log('  No personal form-field values collected: OK');
