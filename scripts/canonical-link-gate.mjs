import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const offenders = [];

function collect(directory, predicate) {
  const files = [];
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    if ([".git", ".vercel", "node_modules"].includes(entry.name)) continue;
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...collect(absolute, predicate));
    else if (entry.isFile() && predicate(absolute)) files.push(absolute);
  }
  return files;
}

const publicHtml = collect(ROOT, file => file.endsWith(".html"));
const renderSources = collect(path.join(ROOT, "src"), file => file.endsWith(".js"));

for (const absolute of [...publicHtml, ...renderSources]) {
  const content = fs.readFileSync(absolute, "utf8");
  for (const match of content.matchAll(/\bhref=(['"])(\/[^'"<>]*)\1/g)) {
    const href = match[2];
    const pathname = href.split(/[?#]/, 1)[0];
    if (pathname !== "/" && pathname.endsWith("/")) {
      offenders.push(`${path.relative(ROOT, absolute)}: ${href}`);
    }
  }
}

for (const episodePath of fs.readFileSync(path.join(ROOT, "src/data/catalog.js"), "utf8").matchAll(/detailPath:\s*"([^"]+)"/g)) {
  if (episodePath[1] !== "/" && episodePath[1].endsWith("/")) {
    offenders.push(`src/data/catalog.js detailPath: ${episodePath[1]}`);
  }
}

if (offenders.length) {
  console.error("Canonical-link gate failed. Internal links must match Vercel's trailingSlash:false routes:\n");
  console.error(offenders.slice(0, 80).join("\n"));
  if (offenders.length > 80) console.error(`\n…plus ${offenders.length - 80} more.`);
  process.exit(1);
}

console.log(`Canonical-link gate passed: ${publicHtml.length} HTML files and ${renderSources.length} render-source files checked.`);
