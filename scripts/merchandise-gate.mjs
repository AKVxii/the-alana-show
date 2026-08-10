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
  "src/components/Merchandise.js",
  "assets/alana-show-merchandise-collection.png"
];
requiredFiles.forEach(path => { if (!fs.existsSync(path)) fail(`missing ${path}`); });

const page = read("merchandise/index.html");
const home = read("src/components/Merchandise.js");
const homeMount = read("src/merchandise-home.js");
const index = read("index.html");
const footer = read("src/components/Footer.js");
const api = read("api/contact.js");
const sitemap = read("sitemap.xml");
const script = read("src/merchandise-page.js");

for (const phrase of [
  "Room Tee I — full quote on front",
  "Room Tee II — front + back quote",
  "Map Tee — All over the map",
  "Show Tee — Save it for the show",
  "Show Hat — Save it for the show"
]) {
  if (!page.includes(phrase)) fail(`merchandise page is missing item: ${phrase}`);
}

if (!page.includes("organic-cotton") || !home.includes("organic-cotton")) fail("organic-cotton launch material is not stated consistently");
if (!page.includes("/assets/alana-show-merchandise-collection.png") || !home.includes("/assets/alana-show-merchandise-collection.png")) fail("approved merchandise collection artwork is not canonical");
if (!page.includes('name="size"') || !page.includes('name="quantity"') || !page.includes('name="payment"')) fail("order inquiry fields are incomplete");
if (!page.includes("No card information is collected here")) fail("payment/privacy boundary is missing");
if (!script.includes('fetch("/api/contact"') || !script.includes('inquiry: "Merchandise order"')) fail("order form is not wired to the first-party contact API");
if (!api.includes('"Merchandise order"')) fail("contact API does not allow merchandise inquiries");
if (!home.includes('href="/merchandise/"') || !homeMount.includes("Merchandise()") || !index.includes("/src/merchandise-home.js")) fail("homepage merchandise discovery is missing");
if (!footer.includes('href="/merchandise/"')) fail("footer merchandise discovery is missing");
if (!sitemap.includes("https://thealanashow.com/merchandise")) fail("merchandise page is missing from sitemap");

console.log("Merchandise gate passed.");
console.log("  Five-item light organic-cotton launch collection, approved artwork, inquiry-only payment boundary, homepage/footer discovery, contact delivery, and sitemap coverage: OK");
