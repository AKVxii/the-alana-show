import fs from "node:fs";
import path from "node:path";
import { site } from "../src/data/site.js";
import { topicHref } from "../src/data/topic-pages.js";

const ROOT = process.cwd();
const inputArg = process.argv.find(arg => !arg.startsWith("--")) || "content/conversation.json";
const inputPath = path.resolve(ROOT, inputArg);

function fail(message) {
  console.error(`Publishing topic sync failed: ${message}`);
  process.exit(1);
}

function escapeHtml(value = "") {
  return String(value).replace(/[&<>"']/g, character => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  })[character]);
}

if (!fs.existsSync(inputPath)) fail(`Input file not found: ${path.relative(ROOT, inputPath)}`);

let input;
try {
  input = JSON.parse(fs.readFileSync(inputPath, "utf8"));
} catch (error) {
  fail(`Input JSON could not be parsed: ${error.message}`);
}

const slug = String(input.slug || "").trim();
if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) fail("A valid explicit slug is required for topic synchronization.");

const episodePath = path.join(ROOT, "episodes", slug, "index.html");
if (!fs.existsSync(episodePath)) fail(`Generated episode page was not found: episodes/${slug}/index.html`);

let html = fs.readFileSync(episodePath, "utf8");
if (html.includes("data-static-episode-topics")) {
  console.log(`Publishing topics already present for ${slug}.`);
  process.exit(0);
}

const rawCategories = Array.isArray(input.categories) ? input.categories : [];
const categories = [...new Set(rawCategories.map(value => String(value).trim()).filter(Boolean))];
if (!categories.length) {
  fail("Provide at least one explicit categories value when verified YouTube topic metadata is unavailable.");
}

const unknown = categories.filter(category => !site.topics.includes(category));
if (unknown.length) {
  fail(`Unknown editorial topic${unknown.length === 1 ? "" : "s"}: ${unknown.join(", ")}. Use one of: ${site.topics.join(", ")}.`);
}

const links = categories
  .map(category => `<a href="${escapeHtml(topicHref(category))}">${escapeHtml(category)}</a>`)
  .join("");
const section = `<section class="related-section episode-topics" data-static-episode-topics aria-labelledby="static-topics-heading"><p class="related-eyebrow"><span></span>EXPLORE MORE</p><h2 id="static-topics-heading">Topics</h2><div class="episode-topic-links">${links}</div></section>`;

const overviewPattern = /(<section\b[^>]*data-static-episode-overview\b[^>]*>[\s\S]*?<\/section>)/i;
if (overviewPattern.test(html)) {
  html = html.replace(overviewPattern, `$1${section}`);
} else {
  const mainClose = html.indexOf("</main>");
  if (mainClose < 0) fail("Could not find a safe insertion point in the generated episode page.");
  html = `${html.slice(0, mainClose)}${section}${html.slice(mainClose)}`;
}

fs.writeFileSync(episodePath, html);
console.log(`Applied ${categories.length} verified editorial topic${categories.length === 1 ? "" : "s"} to ${slug}.`);
