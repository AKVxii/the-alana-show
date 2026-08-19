import fs from "node:fs";

const errors = [];
const read = file => fs.existsSync(file) ? fs.readFileSync(file, "utf8") : "";
const assert = (condition, message) => { if (!condition) errors.push(message); };

const index = read("index.html");
const episodes = read("src/components/Episodes.js");
const featured = read("src/featured-video.js");
const entry = read("src/home-entry.js");
const beyondHome = read("src/beyond-home.js");
const publisher = read("scripts/publish-conversation.mjs");

const orderedEntryMount = /src="\/src\/home-entry\.js(?:\?[^"\s]*)?"/.test(index);
assert(orderedEntryMount, "Homepage must load the ordered home entry module.");
for (const legacy of ["/src/main.js", "/src/merchandise-home.js", "/src/home-nav-accessibility.js"]) {
  assert(!index.includes(`src="${legacy}"`), `Homepage must not duplicate direct module loading for ${legacy}.`);
}

const featuredImport = entry.indexOf('import "./featured-video.js"');
const mainImport = entry.indexOf('import "./main.js"');
assert(featuredImport >= 0 && mainImport > featuredImport, "Featured video custom element must be registered before main.js executes.");
assert(entry.includes('import "./merchandise-home.js"'), "Homepage entry must preserve merchandise behavior.");
assert(entry.includes('import "./beyond-home.js"'), "Homepage entry must preserve Beyond the Show behavior.");
assert(entry.includes('import "./home-nav-accessibility.js"'), "Homepage entry must preserve navigation accessibility behavior.");

assert(beyondHome.includes('import { setupEditorialMotion } from "./lib/motion.js"'), "Dynamically injected Beyond the Show module must initialize editorial motion.");
assert(beyondHome.includes('setupEditorialMotion(beyondHome)'), "Beyond the Show reveal elements must be observed after the module is inserted.");

assert(episodes.includes("<featured-video"), "Homepage Featured Conversation must use the lightweight custom video element.");
assert(episodes.includes("data-featured-video"), "Lightweight featured player must preserve the selector used by live YouTube updates.");
assert(episodes.includes("data-initial-src"), "Lightweight featured player must retain a resilient initial conversation.");
assert(!episodes.includes("<iframe"), "Homepage component must not eagerly ship a third-party YouTube iframe.");

assert(featured.includes('customElements.define("featured-video"'), "Featured video custom element registration is missing.");
assert(featured.includes('document.createElement("iframe")'), "Featured video must create the real player after user interaction.");
assert(featured.includes('addEventListener("click", () => this.play())'), "Featured video must require an explicit play interaction before loading the player.");
assert(featured.includes('loading="lazy"'), "Featured video poster must remain lazy-loaded below the hero.");
assert(featured.includes('trackEvent("Featured Play"'), "Featured play interaction must remain measurable without personal data.");
assert(featured.includes("youtube.com/watch"), "Featured video component must preserve a direct YouTube destination.");

// The homepage may use a lightweight poster, but permanent watch pages must keep
// a crawler-discoverable privacy-enhanced player for video indexing.
assert(publisher.includes("youtube-nocookie.com/embed"), "Permanent episode publishing must retain privacy-enhanced embedded watch pages.");
assert(publisher.includes('"@type": "VideoObject"'), "Permanent episode publishing must retain VideoObject structured data.");

if (errors.length) {
  console.error(`\nHomepage performance gate failed with ${errors.length} issue${errors.length === 1 ? "" : "s"}:\n`);
  errors.forEach(error => console.error(`  - ${error}`));
  process.exit(1);
}

console.log("Homepage performance gate passed.");
console.log("  Heavy YouTube player deferred until explicit play: OK");
console.log("  Lightweight poster + fallback: OK");
console.log("  Ordered homepage module entry: OK");
console.log("  Dynamically injected Beyond the Show motion: OK");
console.log("  Permanent video watch-page indexing architecture preserved: OK");
