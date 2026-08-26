import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";

const ROOT = process.cwd();
const errors = [];
const ignoredDirectories = new Set([".git", ".vercel", "node_modules"]);

const topicRoutes = [
  "leadership",
  "community",
  "business",
  "public-service",
  "faith-purpose",
  "wellness",
  "technology",
  "stepping-up"
].map(topic => `topics/${topic}/index.html`);

const dynamicShellRoutes = [
  "episodes/index.html",
  "guests/index.html",
  "topics/index.html",
  ...topicRoutes,
  "advertise/index.html",
  "book/index.html",
  "on-location/index.html",
  "south-florida/index.html",
  "specials/index.html"
];

const deferredStyleMarkers = [
  "data-media-editorial",
  "data-visual-qa",
  "data-mobile-qa-final",
  "data-archive-character",
  "data-flagship-polish",
  "data-newsletter-styles"
];

function collectHtmlFiles(directory, base = directory) {
  const files = [];
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    if (entry.isDirectory() && ignoredDirectories.has(entry.name)) continue;
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...collectHtmlFiles(absolute, base));
    } else if (entry.isFile() && entry.name.endsWith(".html")) {
      files.push(path.relative(base, absolute).split(path.sep).join("/"));
    }
  }
  return files.sort();
}

function attribute(tag, name) {
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = tag.match(new RegExp(`\\b${escaped}\\s*=\\s*(?:(['\"])(.*?)\\1|([^\\s>]+))`, "i"));
  return match?.[2] ?? match?.[3] ?? null;
}

function appContent(html) {
  const openingTags = html.matchAll(/<div\b[^>]*>/gi);
  const opening = [...openingTags].find(match => attribute(match[0], "id") === "app");
  if (!opening) return null;

  const contentStart = opening.index + opening[0].length;
  const divTags = /<\/?div\b[^>]*>/gi;
  divTags.lastIndex = contentStart;
  let depth = 1;

  for (let match = divTags.exec(html); match; match = divTags.exec(html)) {
    if (/^<\s*\/div/i.test(match[0])) {
      depth -= 1;
      if (depth === 0) return html.slice(contentStart, match.index);
    } else if (!/\/\s*>$/.test(match[0])) {
      depth += 1;
    }
  }

  return undefined;
}

function visibleText(html) {
  return html
    .replace(/<!--[^]*?-->/g, " ")
    .replace(/<(script|style|template|noscript)\b[^>]*>[^]*?<\/\1>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&(?:nbsp|amp|quot|apos|lt|gt|#\d+|#x[\da-f]+);/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function suppressionIssues(html) {
  const issues = [];
  const hiddenDeclaration = /(?:display\s*:\s*none|visibility\s*:\s*hidden|opacity\s*:\s*0+(?:\.0+)?(?:\s*!important)?(?:\s*;|\s*$))/i;

  for (const style of html.matchAll(/<style\b[^>]*>([^]*?)<\/style>/gi)) {
    for (const rule of style[1].matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
      if (/\.static-(?:crawl|first-paint)-fallback\b/i.test(rule[1]) && hiddenDeclaration.test(rule[2])) {
        issues.push(`CSS selector ${rule[1].trim()} hides the first-paint fallback`);
      }
    }
  }

  for (const tag of html.matchAll(/<[^>]+class\s*=\s*(['\"])[^'\"]*\bstatic-(?:crawl|first-paint)-fallback\b[^'\"]*\1[^>]*>/gi)) {
    const inlineStyle = attribute(tag[0], "style") ?? "";
    if (hiddenDeclaration.test(inlineStyle)) issues.push("an inline style hides the first-paint fallback");
    if (/\shidden(?:\s|=|>)/i.test(tag[0])) issues.push("the first-paint fallback has a hidden attribute");
  }

  return [...new Set(issues)];
}

function validateHtmlSet(base, htmlFiles, requiredRoutes, label) {
  const fileSet = new Set(htmlFiles);

  for (const relative of htmlFiles) {
    const html = fs.readFileSync(path.join(base, relative), "utf8");
    const content = appContent(html);

    if (content === undefined) {
      errors.push(`${label}${relative}: #app has no matching closing </div>.`);
    } else if (content !== null && !visibleText(content) && !/<(?:img|svg|video|canvas)\b/i.test(content)) {
      errors.push(`${label}${relative}: must not ship an empty <div id=\"app\"></div> shell.`);
    }

    for (const issue of suppressionIssues(html)) {
      errors.push(`${label}${relative}: ${issue}.`);
    }

    if (/^episodes\/[^/]+\/index\.html$/.test(relative)) {
      if (!html.includes('class="skip-link"') || !html.includes('href="#main-content"')) {
        errors.push(`${label}${relative}: episode detail must deliver its skip link before JavaScript.`);
      }
      if (!/<div class="video-frame"><featured-video\b/i.test(html)) {
        errors.push(`${label}${relative}: episode detail must reserve the lightweight video frame before JavaScript.`);
      }
      if (!/<featured-video\b[^>]*>\s*<a\b[^>]*>Watch on YouTube<\/a>\s*<\/featured-video>/i.test(html)) {
        errors.push(`${label}${relative}: episode fallback must reuse the approved “Watch on YouTube” label.`);
      }
      if (/<iframe\b[^>]*youtube(?:-nocookie)?\.com/i.test(html)) {
        errors.push(`${label}${relative}: episode detail must not eagerly load a YouTube iframe.`);
      }
    }

    if (requiredRoutes.includes(relative)) {
      for (const marker of deferredStyleMarkers) {
        if (new RegExp(`<link\\b[^>]*\\b${marker}\\b`, "i").test(html)) {
          errors.push(`${label}${relative}: enhancement stylesheet ${marker} must not block first paint.`);
        }
      }
    }
  }

  for (const relative of requiredRoutes) {
    if (!fileSet.has(relative)) {
      errors.push(`${label}${relative}: required dynamic shell route is missing.`);
      continue;
    }

    const html = fs.readFileSync(path.join(base, relative), "utf8");
    const content = appContent(html);
    if (content === null || content === undefined) {
      errors.push(`${label}${relative}: must provide a valid #app first-paint fallback.`);
      continue;
    }

    const main = content.match(/<main\b[^>]*>([^]*?)<\/main>/i);
    if (!main) {
      errors.push(`${label}${relative}: #app fallback must contain a semantic <main>.`);
      continue;
    }

    const text = visibleText(main[1]);
    if (!/<h1\b[^>]*>[^]*?<\/h1>/i.test(main[1]) || text.length < 40) {
      errors.push(`${label}${relative}: #app <main> fallback must include an <h1> and meaningful visible content.`);
    }
  }
}

function verifyHubSync() {
  const temporaryRoot = fs.mkdtempSync(path.join(os.tmpdir(), "alana-first-paint-sync-"));
  try {
    for (const relative of [
      "episodes",
      "guests",
      "topics",
      "advertise",
      "book",
      "on-location",
      "south-florida",
      "specials",
      "src/components",
      "src/data",
      "src/lib",
      "scripts/sync-hub-authority.mjs",
      "scripts/sync-first-paint-shells.mjs"
    ]) {
      const source = path.join(ROOT, relative);
      const destination = path.join(temporaryRoot, relative);
      fs.mkdirSync(path.dirname(destination), { recursive: true });
      fs.cpSync(source, destination, { recursive: true });
    }

    for (const script of ["scripts/sync-hub-authority.mjs", "scripts/sync-first-paint-shells.mjs"]) {
      const result = spawnSync(process.execPath, [script], {
        cwd: temporaryRoot,
        encoding: "utf8",
        maxBuffer: 1024 * 1024
      });

      if (result.error || result.status !== 0) {
        const detail = result.error?.message || result.stderr.trim() || result.stdout.trim() || `exit ${result.status}`;
        errors.push(`${script} simulation failed: ${detail}`);
        return;
      }
    }

    const generatedHtml = collectHtmlFiles(temporaryRoot);
    validateHtmlSet(temporaryRoot, generatedHtml, dynamicShellRoutes, "after sync:hubs: ");
  } finally {
    fs.rmSync(temporaryRoot, { recursive: true, force: true });
  }
}

const publicHtml = collectHtmlFiles(ROOT);
validateHtmlSet(ROOT, publicHtml, dynamicShellRoutes, "");
verifyHubSync();

if (errors.length) {
  console.error(`\nFirst-paint resilience gate failed with ${errors.length} issue${errors.length === 1 ? "" : "s"}:\n`);
  errors.forEach(error => console.error(`  - ${error}`));
  process.exit(1);
}

console.log("First-paint resilience gate passed.");
console.log(`  Public HTML routes scanned: ${publicHtml.length}`);
console.log(`  Dynamic shells with meaningful <main> fallbacks: ${dynamicShellRoutes.length}`);
console.log("  Premature fallback suppression: none");
console.log("  sync:hubs first-paint regression simulation: OK");
