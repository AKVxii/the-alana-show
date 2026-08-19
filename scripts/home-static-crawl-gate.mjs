import fs from "node:fs";

const html = fs.readFileSync("index.html", "utf8");
const errors = [];
const assert = (condition, message) => { if (!condition) errors.push(message); };

assert(html.includes('data-static-home-fallback'), "Homepage must ship a crawler-visible static fallback before JavaScript runs.");
assert(!html.includes('<div id="app"></div>'), "Homepage must not regress to an empty JavaScript-only app shell.");
assert(html.includes('Real conversations. <em>Distinct voices.</em> Thoughtful perspective.'), "Static homepage must preserve the core show positioning.");
assert(html.includes('In-depth interviews with people shaping business, public service, culture, and community'), "Static homepage must include substantive show-description copy.");
for (const href of ["/episodes", "/guests", "/topics", "/south-florida", "/about"]) {
  assert(html.includes(`href="${href}"`), `Static homepage must expose a crawlable ${href} authority link.`);
}

const priorityEpisodes = [
  "/episodes/george-lemieux",
  "/episodes/scott-diament-gillian-lieberman",
  "/episodes/stacey-ibarra-vaughn-mitchell",
  "/episodes/ric-bradshaw",
  "/episodes/michael-barnett-2022-midterms"
];
for (const href of priorityEpisodes) {
  assert(html.includes(`href="${href}"`), `Static homepage must link directly to priority watch page ${href}.`);
}
assert(html.includes('class="static-priority-conversations"'), "Homepage must retain a server-delivered priority conversation link group.");
assert(html.includes('Alana K. Vandeveer, host of The Alana Show'), "Static homepage must preserve descriptive host image alt text.");
assert(html.includes('src="/src/home-entry.js"'), "Homepage JavaScript enhancement entry must remain intact.");

if (errors.length) {
  console.error(`Homepage static crawl gate failed with ${errors.length} issue${errors.length === 1 ? "" : "s"}:`);
  errors.forEach(error => console.error(`  - ${error}`));
  process.exit(1);
}

console.log("Homepage static crawl gate passed.");
console.log("  Server-delivered show copy + owned-media authority links: OK");
console.log(`  Direct priority watch-page links: ${priorityEpisodes.length}`);
console.log("  Progressive JavaScript enhancement preserved: OK");
