import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

const ROOT = process.cwd();
const mediaHeaderUrl = pathToFileURL(path.join(ROOT, "src/components/MediaHeader.js")).href;
const footerUrl = pathToFileURL(path.join(ROOT, "src/components/Footer.js")).href;
const { MediaHeader } = await import(mediaHeaderUrl);
const { Footer } = await import(footerUrl);
const read = relative => fs.readFileSync(path.join(ROOT, relative), "utf8");
const write = (relative, content) => fs.writeFileSync(path.join(ROOT, relative), content);
const escapeHtml = value => String(value ?? "").replace(/[&<>"']/g, character => ({
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#039;"
})[character]);

const deferredStyleMarkers = [
  "data-media-editorial",
  "data-visual-qa",
  "data-mobile-qa-final",
  "data-archive-character",
  "data-flagship-polish",
  "data-newsletter-styles"
];

function ensureHeadAssets(html, entryModule) {
  for (const marker of deferredStyleMarkers) {
    html = html.replace(new RegExp(`<link\\b[^>]*\\b${marker}\\b[^>]*>`, "gi"), "");
  }

  const additions = [];
  if (!html.includes(`rel="modulepreload" href="${entryModule}"`)) {
    additions.push(`<link rel="modulepreload" href="${entryModule}">`);
  }
  if (!additions.length) return html;
  if (!html.includes("</head>")) throw new Error("Page is missing </head>.");
  return html.replace("</head>", `${additions.join("")}</head>`);
}

function replaceAppShell(html, shell, label) {
  const pattern = /<div id="app">[\s\S]*?<\/div>(?=<noscript>|<script type="module")/i;
  if (pattern.test(html)) return html.replace(pattern, `<div id="app">${shell}</div>`);
  if (html.includes('<div id="app"></div>')) return html.replace('<div id="app"></div>', `<div id="app">${shell}</div>`);
  throw new Error(`${label} app shell was not found.`);
}

const growthPages = {
  "advertise/index.html": {
    page: "advertise",
    eyebrow: "Partnerships · sponsorships · visibility",
    title: "Advertise & Partner",
    intro: "Explore clearly identified advertising and sponsorship opportunities across The Alana Show's radio, video, podcast, web, and conversation archive."
  },
  "book/index.html": {
    page: "book",
    eyebrow: "Guest inquiries · story ideas · interviews",
    title: "Be a Guest",
    intro: "Have expertise, experience, a public-service story, a business journey, an artistic body of work, or a perspective worth exploring? Start the conversation here."
  },
  "on-location/index.html": {
    page: "on-location",
    eyebrow: "Businesses · events · community · public affairs",
    title: "The Alana Show — On Location",
    intro: "Bring the conversation out of the studio and into the places where the story is actually happening."
  },
  "south-florida/index.html": {
    page: "south-florida",
    eyebrow: "Local conversations · regional reach",
    title: "South Florida",
    intro: "Conversations rooted in South Florida, connecting local leadership, business, service, community, and ideas with listeners across the region."
  },
  "specials/index.html": {
    page: "specials",
    eyebrow: "Focused series · timely conversations",
    title: "Specials",
    intro: "Focused interview series and editorial collections that make timely conversations easier to find, follow, and share."
  }
};

for (const [relative, page] of Object.entries(growthPages)) {
  let html = read(relative);
  const fallback = `${MediaHeader()}<main id="main-content" class="growth-page growth-page-${page.page} static-first-paint-fallback" data-static-first-paint="${page.page}"><section class="media-hero growth-hero"><div class="shell media-hero-inner"><nav class="breadcrumbs" aria-label="Breadcrumb"><ol><li><a href="/">Home</a></li><li aria-current="page">${escapeHtml(page.title)}</li></ol></nav><p class="eyebrow"><span></span> ${escapeHtml(page.eyebrow)}</p><h1>${escapeHtml(page.title)}</h1><p>${escapeHtml(page.intro)}</p></div></section></main>${Footer({ fromSubpage: true })}`;
  html = replaceAppShell(html, fallback, relative);
  write(relative, ensureHeadAssets(html, "/src/growth-page.js"));
}

const modulePages = new Map([
  ["episodes/index.html", "/src/episodes-page.js"],
  ["guests/index.html", "/src/guests-page.js"],
  ["topics/index.html", "/src/topics-page.js"],
  ["topics/leadership/index.html", "/src/topic-detail.js"],
  ["topics/community/index.html", "/src/topic-detail.js"],
  ["topics/business/index.html", "/src/topic-detail.js"],
  ["topics/public-service/index.html", "/src/topic-detail.js"],
  ["topics/faith-purpose/index.html", "/src/topic-detail.js"],
  ["topics/wellness/index.html", "/src/topic-detail.js"],
  ["topics/technology/index.html", "/src/topic-detail.js"],
  ["topics/stepping-up/index.html", "/src/topic-detail.js"]
]);

for (const [relative, entryModule] of modulePages) {
  write(relative, ensureHeadAssets(read(relative), entryModule));
}

console.log(`First-paint shells synced: ${Object.keys(growthPages).length} growth pages, ${modulePages.size} archive pages.`);
