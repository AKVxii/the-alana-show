import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const ignored = new Set([".git", ".vercel", "node_modules"]);
const mediaBase = '<link rel="stylesheet" href="/src/media.css">';
const mediaPolish = '<link rel="stylesheet" href="/src/media-polish.css?v=20260825-smooth" data-media-polish>';

function htmlFiles(directory) {
  const files = [];
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    if (entry.isDirectory() && ignored.has(entry.name)) continue;
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...htmlFiles(absolute));
    else if (entry.isFile() && entry.name.endsWith(".html")) files.push(absolute);
  }
  return files;
}

let updated = 0;
for (const absolute of htmlFiles(ROOT)) {
  let html = fs.readFileSync(absolute, "utf8");
  if (!html.includes(mediaBase)) continue;
  if (html.includes('data-media-polish') || html.includes('/src/media-polish.css')) continue;

  if (!html.includes("</head>")) throw new Error(`${path.relative(ROOT, absolute)} is missing </head>.`);
  html = html.replace("</head>", `${mediaPolish}</head>`);
  fs.writeFileSync(absolute, html);
  updated += 1;
}

console.log(`Media polish linked in ${updated} HTML file${updated === 1 ? "" : "s"}.`);
