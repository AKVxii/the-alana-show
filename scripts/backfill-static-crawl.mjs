import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

const ROOT = process.cwd();
const ORIGIN = "https://thealanashow.com";
const WEBSITE_ID = `${ORIGIN}/#website`;
const SHOW_ID = `${ORIGIN}/#show`;
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

const safeJsonLd = value => JSON.stringify(value).replace(/</g, "\\u003c");

function read(relative) {
  return fs.readFileSync(path.join(ROOT, relative), "utf8");
}

function write(relative, content) {
  fs.writeFileSync(path.join(ROOT, relative), content);
}

function rawPageTitle(html) {
  const match = html.match(/<title>([\s\S]*?)<\/title>/i);
  return decodeHtml(match?.[1] || "").trim();
}

function pageTitle(html) {
  return rawPageTitle(html).replace(/\s*\|\s*(?:Guest\s*\|\s*)?The Alana Show\s*$/i, "").trim();
}

function pageDescription(html) {
  const match = html.match(/<meta\s+name="description"\s+content="([^"]*)"/i);
  return decodeHtml(match?.[1] || "").trim();
}

function pageImage(html) {
  const match = html.match(/<meta\s+property="og:image"\s+content="([^"]*)"/i);
  return decodeHtml(match?.[1] || "").trim();
}

function isoDuration(seconds = 0) {
  const total = Number(seconds || 0);
  if (!Number.isFinite(total) || total <= 0) return "";
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const secs = Math.floor(total % 60);
  return `PT${hours ? `${hours}H` : ""}${minutes ? `${minutes}M` : ""}${secs || (!hours && !minutes) ? `${secs}S` : ""}`;
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
  const description = pageDescription(html) || "Watch this verified conversation on The Alana Show.";
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

function websiteSchema() {
  return { "@type": "WebSite", "@id": WEBSITE_ID, url: `${ORIGIN}/`, name: "The Alana Show" };
}

function showSchema() {
  return { "@type": "PodcastSeries", "@id": SHOW_ID, url: `${ORIGIN}/`, name: "The Alana Show", isPartOf: { "@id": WEBSITE_ID } };
}

function breadcrumbSchema(parent, currentName, canonical) {
  const parentUrl = `${ORIGIN}/${parent.toLowerCase()}`;
  return {
    "@type": "BreadcrumbList",
    "@id": `${canonical}#breadcrumb`,
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: `${ORIGIN}/` },
      { "@type": "ListItem", position: 2, name: parent, item: parentUrl },
      { "@type": "ListItem", position: 3, name: currentName, item: canonical }
    ]
  };
}

function replaceStructuredData(html, graph) {
  const tag = `<script id="detail-structured-data" type="application/ld+json">${safeJsonLd({ "@context": "https://schema.org", "@graph": graph })}</script>`;
  let updated = html.replace(/<script(?:\s+id="detail-structured-data")?\s+type="application\/ld\+json">[\s\S]*?<\/script>/gi, "");
  if (!updated.includes("</head>")) throw new Error("Detail page is missing </head>.");
  updated = updated.replace("</head>", `${tag}</head>`);
  return updated;
}

function ensureImageAltMeta(html, alt) {
  let updated = html;
  if (!updated.includes('property="og:image:alt"')) {
    updated = updated.replace(/(<meta\s+property="og:image"\s+content="[^"]*">)/i, `$1<meta property="og:image:alt" content="${escapeHtml(alt)}">`);
  }
  if (!updated.includes('name="twitter:image:alt"')) {
    updated = updated.replace(/(<meta\s+name="twitter:image"\s+content="[^"]*">)/i, `$1<meta name="twitter:image:alt" content="${escapeHtml(alt)}">`);
  }
  return updated;
}

let liveByVideoId = new Map();
try {
  const response = await fetch(`${ORIGIN}/api/youtube`, { headers: { Accept: "application/json" } });
  if (response.ok) {
    const payload = await response.json();
    liveByVideoId = new Map((payload.episodes || []).map(item => [item.videoId, item]));
  }
} catch {
  // Static page metadata remains a safe fallback if the live feed is unavailable.
}

function episodeGraph(episode, html) {
  const canonical = `${ORIGIN}/episodes/${episode.id}`;
  const live = liveByVideoId.get(episode.videoId) || null;
  const title = live?.title || pageTitle(html) || episode.title;
  const fullPageTitle = rawPageTitle(html) || `${title} | The Alana Show`;
  const conciseDescription = pageDescription(html) || `Watch ${title} on The Alana Show.`;
  const description = live?.description || conciseDescription;
  const image = live?.thumbnail || pageImage(html) || `https://i.ytimg.com/vi/${episode.videoId}/hqdefault.jpg`;
  const relatedGuests = (episode.guestIds || []).map(guestById).filter(Boolean);
  const graph = [
    websiteSchema(),
    showSchema(),
    {
      "@type": "WebPage",
      "@id": `${canonical}#webpage`,
      url: canonical,
      name: fullPageTitle,
      description: conciseDescription,
      isPartOf: { "@id": WEBSITE_ID },
      breadcrumb: { "@id": `${canonical}#breadcrumb` },
      primaryImageOfPage: { "@type": "ImageObject", url: image },
      ...(live?.publishedAt ? { datePublished: live.publishedAt } : {})
    },
    breadcrumbSchema("Episodes", title, canonical)
  ];

  if (live?.publishedAt) {
    const videoObject = {
      "@type": "VideoObject",
      "@id": `${canonical}#video`,
      name: title,
      description,
      thumbnailUrl: [image],
      uploadDate: live.publishedAt,
      embedUrl: `https://www.youtube-nocookie.com/embed/${episode.videoId}`,
      url: canonical,
      mainEntityOfPage: { "@id": `${canonical}#webpage` },
      isPartOf: { "@id": SHOW_ID },
      potentialAction: {
        "@type": "SeekToAction",
        target: `${canonical}?t={seek_to_second_number}`,
        "startOffset-input": "required name=seek_to_second_number"
      },
      about: relatedGuests.map(guest => ({
        "@type": "Person",
        "@id": `${ORIGIN}/guests/${guest.id}#person`,
        name: guest.name,
        url: `${ORIGIN}/guests/${guest.id}`
      }))
    };
    const duration = isoDuration(live.durationSeconds);
    if (duration) videoObject.duration = duration;
    if (Number.isFinite(Number(live.viewCount)) && Number(live.viewCount) >= 0) {
      videoObject.interactionStatistic = {
        "@type": "InteractionCounter",
        interactionType: { "@type": "WatchAction" },
        userInteractionCount: Number(live.viewCount)
      };
    }
    graph.push(videoObject);
    graph[2].mainEntity = { "@id": `${canonical}#video` };
  }
  return graph;
}

function guestGraph(guest, html) {
  const canonical = `${ORIGIN}/guests/${guest.id}`;
  const name = pageTitle(html) || guest.name;
  const pageTitleValue = rawPageTitle(html) || `${name} | Guest | The Alana Show`;
  const description = pageDescription(html) || `Explore verified conversations featuring ${name} on The Alana Show.`;
  return [
    websiteSchema(),
    showSchema(),
    {
      "@type": "WebPage",
      "@id": `${canonical}#webpage`,
      url: canonical,
      name: pageTitleValue,
      description,
      isPartOf: { "@id": WEBSITE_ID },
      breadcrumb: { "@id": `${canonical}#breadcrumb` },
      mainEntity: { "@id": `${canonical}#person` }
    },
    breadcrumbSchema("Guests", name, canonical),
    {
      "@type": "Person",
      "@id": `${canonical}#person`,
      name,
      url: canonical,
      subjectOf: (guest.episodeIds || []).map(episodeId => ({
        "@type": "WebPage",
        "@id": `${ORIGIN}/episodes/${episodeId}#webpage`,
        url: `${ORIGIN}/episodes/${episodeId}`
      }))
    }
  ];
}

let changedEpisodes = 0;
let changedGuests = 0;

for (const episode of episodes) {
  const relative = `episodes/${episode.id}/index.html`;
  const original = read(relative);
  let updated = replaceApp(original, episodeFallback(episode, original));
  updated = ensureImageAltMeta(updated, pageTitle(updated) || episode.title);
  updated = replaceStructuredData(updated, episodeGraph(episode, updated));
  if (updated !== original) {
    write(relative, updated);
    changedEpisodes += 1;
  }
}

for (const guest of guests) {
  const relative = `guests/${guest.id}/index.html`;
  const original = read(relative);
  let updated = replaceApp(original, guestFallback(guest, original));
  updated = ensureImageAltMeta(updated, `${guest.name} on The Alana Show`);
  updated = replaceStructuredData(updated, guestGraph(guest, updated));
  if (updated !== original) {
    write(relative, updated);
    changedGuests += 1;
  }
}

console.log(`Static archive backfill complete: ${changedEpisodes} episode pages, ${changedGuests} guest pages updated.`);
console.log(`Verified live video metadata matched: ${[...liveByVideoId.keys()].filter(videoId => episodes.some(episode => episode.videoId === videoId)).length}/${episodes.length}`);
