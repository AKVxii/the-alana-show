import fs from 'node:fs';

const errors = [];
const read = file => {
  if (!fs.existsSync(file)) {
    errors.push(`Missing required file: ${file}`);
    return '';
  }
  return fs.readFileSync(file, 'utf8');
};
const assert = (condition, message) => {
  if (!condition) errors.push(message);
};

const notFound = read('404.html');
const mediaHeader = read('src/components/MediaHeader.js');
const searchDialog = read('src/components/SearchDialog.js');
const detailPage = read('src/detail-page.js');
const sitemap = read('sitemap.xml');

assert(/<meta\s+name=["']robots["']\s+content=["']noindex,follow["']/i.test(notFound), '404.html must be noindex,follow.');
assert(/<title>Page Not Found \| The Alana Show<\/title>/i.test(notFound), '404.html is missing its branded title.');
assert(!/<link\b[^>]*rel=["']canonical["']/i.test(notFound), '404.html must not declare a canonical URL.');
assert(/class=["']skip-link["'][^>]*href=["']#main-content["']/i.test(notFound), '404.html is missing a skip link.');
for (const href of ['/', '/episodes', '/guests']) {
  assert(notFound.includes(`href="${href}"`), `404.html is missing recovery link ${href}.`);
}
assert(!sitemap.includes('/404'), '404 page must not be listed in sitemap.xml.');

assert(mediaHeader.includes('aria-current'), 'Subpage navigation must identify the current page.');
assert(mediaHeader.includes('focusFirst'), 'Subpage mobile navigation must move focus into the opened menu.');
assert(mediaHeader.includes('restoreFocus'), 'Subpage mobile navigation must restore focus when dismissed.');
assert(searchDialog.includes('aria-labelledby="site-search-title"'), 'Search dialog must be named by its visible heading.');
assert(searchDialog.includes('id="site-search-title"'), 'Search dialog heading id is missing.');
assert(detailPage.includes('if (root && !document.querySelector(".skip-link"))'), 'Detail pages must preserve the skip-link fallback.');

if (errors.length) {
  console.error(`\nResilience gate failed with ${errors.length} issue${errors.length === 1 ? '' : 's'}:\n`);
  errors.forEach(error => console.error(`  - ${error}`));
  process.exit(1);
}

console.log('Accessibility and resilience gate passed.');
console.log('  Branded 404 recovery page: OK');
console.log('  Current-page navigation and keyboard focus handling: OK');
console.log('  Search dialog and detail-page accessibility safeguards: OK');
