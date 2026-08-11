import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const errors = [];
const report = [];
const fail = message => errors.push(message);
const exists = relative => fs.existsSync(path.join(ROOT, relative));
const bytes = relative => fs.statSync(path.join(ROOT, relative)).size;
const read = relative => fs.readFileSync(path.join(ROOT, relative), "utf8");
const format = value => `${(value / 1024).toFixed(value >= 1024 * 100 ? 0 : 1)} KB`;

const BUDGETS = Object.freeze({
  homepageHtml: 150 * 1024,
  preloadImage: 750 * 1024,
  referencedImage: 2 * 1024 * 1024,
  stylesheet: 250 * 1024,
  script: 250 * 1024,
  homepageCssTotal: 400 * 1024,
  homepageStylesheets: 10
});

const IMAGE_EXTENSIONS = new Set([".png", ".jpg", ".jpeg", ".webp", ".avif", ".gif", ".svg"]);
const STYLE_EXTENSIONS = new Set([".css"]);
const SCRIPT_EXTENSIONS = new Set([".js", ".mjs"]);
const TEXT_EXTENSIONS = new Set([".html", ".js", ".mjs", ".css"]);
const IGNORE_DIRS = new Set([".git", "node_modules"]);

function localPathFromUrl(value) {
  const clean = String(value || "").split("#")[0].split("?")[0].trim();
  if (!clean.startsWith("/") || clean.startsWith("//")) return null;
  const relative = clean.slice(1);
  if (!relative || relative.includes("..")) return null;
  return relative;
}

function collectTextFiles(directory = ROOT, output = []) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    if (IGNORE_DIRS.has(entry.name)) continue;
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      collectTextFiles(absolute, output);
      continue;
    }
    if (TEXT_EXTENSIONS.has(path.extname(entry.name).toLowerCase())) output.push(absolute);
  }
  return output;
}

function collectLocalReferences() {
  const references = new Map();
  const urlPattern = /(?:src|href)\s*=\s*["']([^"']+)["']|url\(\s*["']?([^)'"\s]+)["']?\s*\)/g;
  for (const absolute of collectTextFiles()) {
    const relativeSource = path.relative(ROOT, absolute).replace(/\\/g, "/");
    const text = fs.readFileSync(absolute, "utf8");
    for (const match of text.matchAll(urlPattern)) {
      const relative = localPathFromUrl(match[1] || match[2]);
      if (!relative || !exists(relative)) continue;
      if (!references.has(relative)) references.set(relative, new Set());
      references.get(relative).add(relativeSource);
    }
  }
  return references;
}

function stylesheetLinks(html) {
  return [...html.matchAll(/<link\b[^>]*rel=["']stylesheet["'][^>]*href=["']([^"']+)["'][^>]*>/gi)]
    .map(match => localPathFromUrl(match[1]))
    .filter(Boolean);
}

function preloadedImages(html) {
  return [...html.matchAll(/<link\b[^>]*rel=["']preload["'][^>]*as=["']image["'][^>]*href=["']([^"']+)["'][^>]*>/gi)]
    .map(match => localPathFromUrl(match[1]))
    .filter(Boolean);
}

const homepage = read("index.html");
const homepageBytes = bytes("index.html");
if (homepageBytes > BUDGETS.homepageHtml) fail(`Homepage HTML is ${format(homepageBytes)}; budget is ${format(BUDGETS.homepageHtml)}.`);
report.push(`Homepage HTML: ${format(homepageBytes)} / ${format(BUDGETS.homepageHtml)}`);

const homepageStyles = [...new Set(stylesheetLinks(homepage))].filter(exists);
const homepageCssBytes = homepageStyles.reduce((sum, file) => sum + bytes(file), 0);
if (homepageStyles.length > BUDGETS.homepageStylesheets) {
  fail(`Homepage requests ${homepageStyles.length} first-party stylesheets; budget is ${BUDGETS.homepageStylesheets}.`);
}
if (homepageCssBytes > BUDGETS.homepageCssTotal) {
  fail(`Homepage linked CSS totals ${format(homepageCssBytes)}; budget is ${format(BUDGETS.homepageCssTotal)}.`);
}
report.push(`Homepage CSS: ${format(homepageCssBytes)} across ${homepageStyles.length} stylesheet${homepageStyles.length === 1 ? "" : "s"}`);

for (const file of preloadedImages(homepage)) {
  if (!exists(file)) {
    fail(`Preloaded homepage image is missing: ${file}.`);
    continue;
  }
  const size = bytes(file);
  if (size > BUDGETS.preloadImage) fail(`Preloaded image ${file} is ${format(size)}; budget is ${format(BUDGETS.preloadImage)}.`);
  report.push(`Preload ${file}: ${format(size)} / ${format(BUDGETS.preloadImage)}`);
}

const references = collectLocalReferences();
const browserAssets = [];
for (const [file, sources] of references) {
  const extension = path.extname(file).toLowerCase();
  const size = bytes(file);
  if (IMAGE_EXTENSIONS.has(extension)) {
    browserAssets.push({ file, size, kind: "image", sources: [...sources] });
    if (size > BUDGETS.referencedImage) {
      fail(`Referenced image ${file} is ${format(size)}; budget is ${format(BUDGETS.referencedImage)}. Referenced by ${[...sources].slice(0, 3).join(", ")}.`);
    }
  } else if (STYLE_EXTENSIONS.has(extension)) {
    browserAssets.push({ file, size, kind: "stylesheet", sources: [...sources] });
    if (size > BUDGETS.stylesheet) fail(`Stylesheet ${file} is ${format(size)}; budget is ${format(BUDGETS.stylesheet)}.`);
  } else if (SCRIPT_EXTENSIONS.has(extension)) {
    browserAssets.push({ file, size, kind: "script", sources: [...sources] });
    if (size > BUDGETS.script) fail(`Script ${file} is ${format(size)}; budget is ${format(BUDGETS.script)}.`);
  }
}

const largest = browserAssets.sort((a, b) => b.size - a.size).slice(0, 8);
report.push("Largest referenced first-party assets:");
for (const asset of largest) report.push(`  ${format(asset.size).padStart(9)}  ${asset.kind.padEnd(10)} ${asset.file}`);

if (errors.length) {
  console.error(`\nPerformance budget gate failed with ${errors.length} issue${errors.length === 1 ? "" : "s"}:\n`);
  errors.forEach(error => console.error(`  - ${error}`));
  console.error("\nCurrent performance report:");
  report.forEach(line => console.error(`  ${line}`));
  process.exit(1);
}

console.log("Performance budget gate passed.");
report.forEach(line => console.log(`  ${line}`));
console.log("  Accidental heavy-asset and bundle regressions: BLOCKED");
