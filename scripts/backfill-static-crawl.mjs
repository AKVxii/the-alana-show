import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

const ROOT = process.cwd();
const catalogUrl = pathToFileURL(path.join(ROOT, "src/data/catalog.js")).href;
const { episodes, guests, episodeById, guestById } = await import(catalogUrl);

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

function read(relative) {
  return fs.readFileSync(path.join(ROOT, relative), "utf8");
}

function write(relative, content) {
  fs.writeFileSync(path.join(ROOT, relative), content);
}

function pageTitle(html) {
  const match = html.match(/<title>([\s\S]*?)<\/title>/i);
  return decodeHtml(match?.[1] || "").replace(/\s*\|\s*(?:Guest\s*\|\s*)?The Alana Show\s*$/i, "").trim();
}

function pageDescription(html) {
  const match = html.match(/<meta\s+name="description"\s+content="([^"]*)"/i);
  return decodeHtml(match?.[1] || "").trim();
}

function replaceApp(html, fallback) {
  if (html.includes("data-static-crawl-fallback")) return html;
  const marker = '<div id="app"></div>';
  if (!html.includes(marker)) throw new Error("Expected empty #app shell was not found.");
  return html.replace(marker, `<div id="app">${fallback}</div>`);
}

function breadcrumbs(parent, current) {
  return `<nav class="breadcrumbs" aria-label="Breadcrumb"><ol><li><a href="/">Home</a></li><li><a href="/${parent.toLowerCase()}">${escapeHtml(parent)}</a></li><li aria-current="page">${escapeHtml(current)}</li></ol></nav>`;
}

function episodeFallback(episode, html) {
  const title = pageTitle(html) || episode.title;
  const description = pageDescription(html) || `Watch this verified conversation on The Alana Show.`;
  const relatedGuests = (episode.guestIds || []).map(guestById).filter(Boolean);
  const guestLinks = relatedGuests.map(guest => `<a href="/guests/${escapeHtml(guest.id)}">${escapeHtml(guest.name)}</a>`).join(" and ");
  return `<main id="main-content" class="static-detail-fallback" data-static-crawl-fallback="episode"><section class="detail-hero"><div class="shell detail-shell">${breadcrumbs("Episodes", title)}<p class="eyebrow"><span></span> Episode</p><h1>${escapeHtml(title)}</h1>${guestLinks ? `<p class="detail-byline">A conversation with ${guestLinks}</p>` : ""}<p>${escapeHtml(description)}</p><div class="detail-actions"><a class="button button-gold" href="https://www.youtube.com/watch?v=${encodeURIComponent(episode.videoId)}" target="_blank" rel="noopener">Watch on YouTube</a><a class="button button-outline" href="/episodes">More conversations</a></div></div></section></main>`;
}

function guestFallback(guest, html) {
  const title = pageTitle(html) || guest.name;
  const description = pageDescription(html) || `Explore verified conversations featuring ${guest.name} on The Alana Show.`;
  const relatedEpisodes = (guest.episodeIds || []).map(episodeById).filter(Boolean);
  const episodeLinks = relatedEpisodes.map(episode => `<li><a href="/episodes/${escapeHtml(episode.id)}">${escapeHtml(episode.title)}</a></li>`).join("");
  return `<main id="main-content" class="static-detail-fallback" data-static-crawl-fallback="guest"><section class="detail-hero"><div class="shell detail-shell">${breadcrumbs("Guests", title)}<p class="eyebrow"><span></span> Guest</p><h1>${escapeHtml(title)}</h1><p>${escapeHtml(description)}</p>${episodeLinks ? `<section class="related-section" aria-labelledby="static-related-heading"><p class="related-eyebrow"><span></span> VERIFIED ARCHIVE</p><h2 id="static-related-heading">Related conversations</h2><ul>${episodeLinks}</ul></section>` : ""}<div class="detail-actions"><a class="button button-gold" href="/episodes?guest=${encodeURIComponent(guest.name)}">View conversations</a><a class="button button-outline" href="/guests">Guest directory</a></div></div></section></main>`;
}

let changedEpisodes = 0;
let changedGuests = 0;

for (const episode of episodes) {
  const relative = `episodes/${episode.id}/index.html`;
  const original = read(relative);
  const updated = replaceApp(original, episodeFallback(episode, original));
  if (updated !== original) {
    write(relative, updated);
    changedEpisodes += 1;
  }
}

for (const guest of guests) {
  const relative = `guests/${guest.id}/index.html`;
  const original = read(relative);
  const updated = replaceApp(original, guestFallback(guest, original));
  if (updated !== original) {
    write(relative, updated);
    changedGuests += 1;
  }
}

console.log(`Static crawl fallback backfill complete: ${changedEpisodes} episode pages, ${changedGuests} guest pages updated.`);
