import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

const ROOT = process.cwd();
const mediaHeaderUrl = pathToFileURL(path.join(ROOT, "src/components/MediaHeader.js")).href;
const headerUrl = pathToFileURL(path.join(ROOT, "src/components/Header.js")).href;
const footerUrl = pathToFileURL(path.join(ROOT, "src/components/Footer.js")).href;
const { MediaHeader } = await import(mediaHeaderUrl);
const { Header } = await import(headerUrl);
const { Footer } = await import(footerUrl);

const pages = [
  "about/index.html",
  "accessibility/index.html",
  "privacy/index.html",
  "standards/index.html",
  "press/index.html",
  "merchandise/index.html",
  "beyond-the-show/index.html"
];

function collectHtml(directory) {
  const files = [];
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    if ([".git", ".vercel", "node_modules"].includes(entry.name)) continue;
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...collectHtml(absolute));
    else if (entry.isFile() && entry.name.endsWith(".html")) files.push(absolute);
  }
  return files;
}

function replaceContainerContent(html, attributePattern, content, label) {
  const openingPattern = new RegExp(`<div\\b[^>]*${attributePattern}[^>]*>`, "i");
  const opening = openingPattern.exec(html);
  if (!opening) throw new Error(`${label} container was not found.`);

  const contentStart = opening.index + opening[0].length;
  const divTags = /<\/?div\b[^>]*>/gi;
  divTags.lastIndex = contentStart;
  let depth = 1;

  for (let match = divTags.exec(html); match; match = divTags.exec(html)) {
    if (/^<\s*\/div/i.test(match[0])) {
      depth -= 1;
      if (depth === 0) return `${html.slice(0, contentStart)}${content}${html.slice(match.index)}`;
    } else if (!/\/\s*>$/.test(match[0])) {
      depth += 1;
    }
  }

  throw new Error(`${label} container has no matching closing </div>.`);
}

for (const relative of pages) {
  const absolute = path.join(ROOT, relative);
  let html = fs.readFileSync(absolute, "utf8");
  html = replaceContainerContent(html, "data-[a-z0-9-]+-header", MediaHeader(), `${relative} header`);
  html = replaceContainerContent(html, "data-[a-z0-9-]+-footer", Footer({ fromSubpage: true }), `${relative} footer`);
  fs.writeFileSync(absolute, html);
}

{
  const relative = "candidates/index.html";
  const absolute = path.join(ROOT, relative);
  let html = fs.readFileSync(absolute, "utf8");
  const main = html.match(/<main id="main-content"[\s\S]*<\/main>/i)?.[0];
  if (!main) throw new Error(`${relative} first-paint main was not found.`);
  html = replaceContainerContent(
    html,
    'id="app"',
    `${MediaHeader()}${main}${Footer({ fromSubpage: true })}`,
    `${relative} app`
  );
  fs.writeFileSync(absolute, html);
}

let detailPages = 0;
for (const absolute of collectHtml(ROOT)) {
  let html = fs.readFileSync(absolute, "utf8");
  if (!/<body\b[^>]*\bdata-detail-type=/i.test(html)) continue;
  const main = html.match(/<main id="main-content" class="static-detail-fallback"[\s\S]*<\/main>/i)?.[0];
  if (!main) throw new Error(`${path.relative(ROOT, absolute)} detail fallback main was not found.`);
  html = replaceContainerContent(
    html,
    'id="app"',
    `${MediaHeader()}${main}${Footer({ fromSubpage: true })}`,
    `${path.relative(ROOT, absolute)} app`
  );
  fs.writeFileSync(absolute, html);
  detailPages += 1;
}

{
  const relative = "index.html";
  const absolute = path.join(ROOT, relative);
  let html = fs.readFileSync(absolute, "utf8");
  let main = html.match(/<main id="main-content" class="static-home-fallback"[\s\S]*<\/main>/i)?.[0];
  if (!main) throw new Error(`${relative} first-paint main was not found.`);

  html = replaceContainerContent(html, 'id="app"', `${Header()}${main}`, `${relative} app`);
  fs.writeFileSync(absolute, html);
}

console.log(`Static site chrome synced: ${pages.length + 2 + detailPages} pages.`);
