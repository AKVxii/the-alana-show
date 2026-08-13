import fs from "node:fs";

const fail = message => {
  console.error(`Merchandise gate failed: ${message}`);
  process.exit(1);
};

const read = path => fs.readFileSync(path, "utf8");
const requiredFiles = [
  "merchandise/index.html",
  "src/merchandise-page.js",
  "src/merchandise-home.js",
  "src/merchandise.css",
  "src/merchandise-expansion.css",
  "src/components/Merchandise.js",
  "assets/alana-show-merchandise-collection.png",
  "assets/tell-em-now-trust-em-later-tee.svg",
  "assets/i-work-for-the-lord-tee.svg"
];
requiredFiles.forEach(path => { if (!fs.existsSync(path)) fail(`missing ${path}`); });

const page = read("merchandise/index.html");
const home = read("src/components/Merchandise.js");
const homeMount = read("src/merchandise-home.js");
const index = read("index.html");
const homeEntry = fs.existsSync("src/home-entry.js") ? read("src/home-entry.js") : "";
const footer = read("src/components/Footer.js");
const api = read("api/contact.js");
const sitemap = read("sitemap.xml");
const script = read("src/merchandise-page.js");

for (const phrase of [
  "Room Tee I — full quote on front",
  "Room Tee II — front + back quote",
  "Map Tee — All over the map",
  "Show Tee — Save it for the show",
  "Show Hat — Save it for the show",
  "Tell ’Em Tee — Tell ’em now. Trust ’em later.",
  "Lord Tee — I work for The Lord."
]) {
  if (!page.includes(phrase)) fail(`merchandise page is missing item: ${phrase}`);
}

if (!home.includes("organic-cotton")) fail("homepage merchandise teaser must retain verified organic-cotton tee material wording");
if (page.includes("organic-cotton tees and hats") || home.includes("organic-cotton tees and hats")) fail("organic-cotton wording must not imply an unverified hat composition");
if (!page.includes("White, Medium") && !page.includes("White · Medium")) fail("Lord Tee prototype must retain the White / Medium sample specification");
if (!page.includes("/assets/tell-em-now-trust-em-later-tee.svg")) fail("Tell ’Em Tee concept artwork is missing");
if (!page.includes("/assets/i-work-for-the-lord-tee.svg")) fail("Lord Tee concept artwork is missing");
if (!script.includes("merchandise-expansion.css")) fail("merchandise expansion styling is not loaded");
if (!page.includes("/assets/alana-show-merchandise-collection.png") || !home.includes("/assets/alana-show-merchandise-collection.png")) fail("approved merchandise collection artwork is not canonical");
if (!page.includes('name="size"') || !page.includes('name="quantity"') || !page.includes('name="payment"')) fail("order inquiry fields are incomplete");
if (!page.includes("No card information is collected here")) fail("payment/privacy boundary is missing");
if (!script.includes('fetch("/api/contact"') || !script.includes('inquiry: "Merchandise order"')) fail("order form is not wired to the first-party contact API");
if (!script.includes("syncSizeOptions") || !script.includes("Hat — adjustable / one size")) fail("item-aware merchandise sizing is missing");
if (!api.includes('"Merchandise order"')) fail("contact API does not allow merchandise inquiries");

const directHomeMount = index.includes('src="/src/merchandise-home.js"');
const orderedHomeMount = index.includes('src="/src/home-entry.js"') && homeEntry.includes('import "./merchandise-home.js"');
if (!home.includes('href="/merchandise/"') || !homeMount.includes("Merchandise()") || !(directHomeMount || orderedHomeMount)) {
  fail("homepage merchandise discovery is missing");
}

if (!footer.includes('href="/merchandise/"')) fail("footer merchandise discovery is missing");
if (!sitemap.includes("https://thealanashow.com/merchandise")) fail("merchandise page is missing from sitemap");
if (fs.existsSync("assets/alana-show-merchandise-collection.webp.png")) fail("accidental double-extension merchandise asset still exists");

console.log("Merchandise gate passed.");
console.log("  Seven-piece collection including Tell ’Em Tee and White/Medium Lord Tee prototype, approved artwork, item-aware sizing, inquiry-only payment boundary, homepage/footer discovery, contact delivery, and sitemap coverage: OK");
