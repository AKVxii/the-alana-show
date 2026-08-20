import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

const ROOT = process.cwd();
const ORIGIN = "https://thealanashow.com";
const WEBSITE_ID = `${ORIGIN}/#website`;

const catalogUrl = pathToFileURL(path.join(ROOT, "src/data/catalog.js")).href;
const topicsUrl = pathToFileURL(path.join(ROOT, "src/data/topic-pages.js")).href;
const { episodes, guests } = await import(catalogUrl);
const { topicPages } = await import(topicsUrl);

const read = relative => fs.readFileSync(path.join(ROOT, relative), "utf8");
const write = (relative, content) => fs.writeFileSync(path.join(ROOT, relative), content);
const escapeHtml = value => String(value ?? "").replace(/[&<>"']/g, char => ({
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#039;"
})[char]);
const decodeHtml = value => String(value ?? "")
  .replace(/&amp;/g, "&")
  .replace(/&quot;/g, '"')
  .replace(/&#0?39;/g, "'")
  .replace(/&apos;/g, "'")
  .replace(/&lt;/g, "<")
  .replace(/&gt;/g, ">");
const safeJsonLd = value => JSON.stringify(value).replace(/</g, "\\u003c");

function detailTitle(relative, fallback) {
  const absolute = path.join(ROOT, relative);
  if (!fs.existsSync(absolute)) return fallback;
  const html = fs.readFileSync(absolute, "utf8");
  const match = html.match(/<title>([\s\S]*?)<\/title>/i);
  return decodeHtml(match?.[1] || "")
    .replace(/\s*\|\s*(?:Guest\s*\|\s*)?The Alana Show\s*$/i, "")
    .trim() || fallback;
}

function hubGraph({ id, name, description, items }) {
  const canonical = `${ORIGIN}/${id}`;
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "@id": WEBSITE_ID,
        url: `${ORIGIN}/`,
        name: "The Alana Show"
      },
      {
        "@type": "CollectionPage",
        "@id": `${canonical}#collection`,
        url: canonical,
        name,
        description,
        isPartOf: { "@id": WEBSITE_ID },
        breadcrumb: { "@id": `${canonical}#breadcrumb` },
        mainEntity: { "@id": `${canonical}#item-list` }
      },
      {
        "@type": "BreadcrumbList",
        "@id": `${canonical}#breadcrumb`,
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: `${ORIGIN}/` },
          { "@type": "ListItem", position: 2, name, item: canonical }
        ]
      },
      {
        "@type": "ItemList",
        "@id": `${canonical}#item-list`,
        name: `${name} directory`,
        numberOfItems: items.length,
        itemListElement: items.map((item, index) => ({
          "@type": "ListItem",
          position: index + 1,
          name: item.name,
          item: item.url
        }))
      }
    ]
  };
}

function injectStructuredData(html, graph) {
  const tag = `<script id="hub-structured-data" type="application/ld+json">${safeJsonLd(graph)}</script>`;
  let updated = html.replace(/<script\s+id="hub-structured-data"\s+type="application\/ld\+json">[\s\S]*?<\/script>/i, "");
  if (!updated.includes("</head>")) throw new Error("Hub page is missing </head>.");
  return updated.replace("</head>", `${tag}</head>`);
}

function removePrematureFallbackSuppression(html) {
  return html
    .replace(/<script>\s*document\.documentElement\.classList\.add\(["']js-enabled["']\)\s*<\/script>/gi, "")
    .replace(/<style>\s*\.js-enabled\s+\.static-crawl-fallback\s*\{\s*display\s*:\s*none\s*;?\s*\}\s*<\/style>/gi, "");
}

function ensureTopicFirstPaintFallback(html, topic) {
  if (html.includes(`data-static-topic-fallback="${topic.id}"`)) return html;

  const navMatch = html.match(/<nav class="static-crawl-fallback"[\s\S]*?<\/nav>/i);
  if (!navMatch) throw new Error(`Topic page ${topic.id} is missing its static discovery navigation.`);
  if (!html.includes('<div id="app"></div>')) throw new Error(`Topic page ${topic.id} is missing its app shell.`);

  const fallback = `<main id="main-content" class="static-crawl-fallback static-topic-fallback" data-static-topic-fallback="${escapeHtml(topic.id)}"><section class="media-hero topics-hero"><div class="shell media-hero-inner"><p class="eyebrow"><span></span> Topic archive</p><h1>${escapeHtml(topic.title)}</h1><p>${escapeHtml(topic.intro)}</p></div></section><section class="media-section"><div class="shell">${navMatch[0]}</div></section></main>`;
  return html
    .replace(navMatch[0], "")
    .replace('<div id="app"></div>', `<div id="app">${fallback}</div>`);
}

const episodeItems = episodes.map(episode => ({
  name: detailTitle(`episodes/${episode.id}/index.html`, episode.title),
  url: `${ORIGIN}/episodes/${episode.id}`,
  href: `/episodes/${episode.id}`
}));
const guestItems = guests.map(guest => ({
  name: guest.name,
  url: `${ORIGIN}/guests/${guest.id}`,
  href: `/guests/${guest.id}`
}));
const topicItems = topicPages.map(topic => ({
  name: topic.title || topic.name,
  label: topic.name,
  description: topic.description,
  url: `${ORIGIN}/topics/${topic.id}`,
  href: `/topics/${topic.id}/`
}));

let episodesHtml = removePrematureFallbackSuppression(read("episodes/index.html"));
const episodeList = episodeItems.map(item => `<li><a href="${escapeHtml(item.href)}">${escapeHtml(item.name)}</a></li>`).join("\n");
episodesHtml = episodesHtml.replace(/(<h2>Conversation archive<\/h2><ul>)[\s\S]*?(<\/ul>)/i, `$1\n${episodeList}\n$2`);
episodesHtml = injectStructuredData(episodesHtml, hubGraph({
  id: "episodes",
  name: "Episodes",
  description: "Browse and search verified conversations from The Alana Show by title, guest, and topic.",
  items: episodeItems
}));
write("episodes/index.html", episodesHtml);

let guestsHtml = removePrematureFallbackSuppression(read("guests/index.html"));
const guestList = guestItems.map(item => `<li><a href="${escapeHtml(item.href)}">${escapeHtml(item.name)}</a></li>`).join("\n");
guestsHtml = guestsHtml.replace(/(<h2>Verified guest directory<\/h2><ul>)[\s\S]*?(<\/ul>)/i, `$1\n${guestList}\n$2`);
guestsHtml = injectStructuredData(guestsHtml, hubGraph({
  id: "guests",
  name: "Guests",
  description: "Browse the verified guest directory for The Alana Show and find related conversations.",
  items: guestItems
}));
write("guests/index.html", guestsHtml);

let topicsHtml = removePrematureFallbackSuppression(read("topics/index.html"));
const topicList = topicItems.map(item => `<li><a href="${escapeHtml(item.href)}"><strong>${escapeHtml(item.label)}</strong><span>${escapeHtml(item.description)}</span></a></li>`).join("\n");
const topicFallback = `<main id="main-content" class="static-crawl-fallback"><section class="media-hero topics-hero"><div class="shell media-hero-inner"><p class="eyebrow"><span></span> Discover the archive</p><h1>Topics</h1><p>Follow the ideas, issues, and areas of expertise that connect conversations across The Alana Show.</p></div></section><section class="media-section"><div class="shell"><h2>Explore conversations by topic</h2><ul>${topicList}</ul></div></section></main>`;
const fallbackPattern = /<div id="app">[\s\S]*?<\/div>(?=<noscript>|<script type="module")/i;
if (fallbackPattern.test(topicsHtml)) topicsHtml = topicsHtml.replace(fallbackPattern, `<div id="app">${topicFallback}</div>`);
else if (topicsHtml.includes('<div id="app"></div>')) topicsHtml = topicsHtml.replace('<div id="app"></div>', `<div id="app">${topicFallback}</div>`);
else throw new Error("Topics hub app shell was not found.");
topicsHtml = injectStructuredData(topicsHtml, hubGraph({
  id: "topics",
  name: "Topics",
  description: "Explore The Alana Show conversations by verified topic, including leadership, business, public service, wellness, technology, faith, and community.",
  items: topicItems
}));
write("topics/index.html", topicsHtml);

for (const topic of topicPages) {
  const relative = `topics/${topic.id}/index.html`;
  const html = ensureTopicFirstPaintFallback(removePrematureFallbackSuppression(read(relative)), topic);
  write(relative, html);
}

console.log(`Hub authority synced: ${episodeItems.length} episodes, ${guestItems.length} guests, ${topicItems.length} topics.`);
