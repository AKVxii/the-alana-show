import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

const ROOT = process.cwd();
const ORIGIN = "https://thealanashow.com";
const WEBSITE_ID = `${ORIGIN}/#website`;
const SHOW_ID = `${ORIGIN}/#show`;
const catalogUrl = pathToFileURL(path.join(ROOT, "src/data/catalog.js")).href;
const { episodes, guests, episodeById, guestById } = await import(catalogUrl);
const profilesUrl = pathToFileURL(path.join(ROOT, "src/data/guest-profiles.js")).href;
const { guestProfileById } = await import(profilesUrl);
const topicsUrl = pathToFileURL(path.join(ROOT, "src/data/topic-pages.js")).href;
const { topicHref } = await import(topicsUrl);
const episodeArg = process.argv.find(arg => arg.startsWith("--episode="));
const guestsArg = process.argv.find(arg => arg.startsWith("--guests="));
const targetEpisodeId = episodeArg ? episodeArg.slice("--episode=".length).trim() : "";
const targetGuestIds = guestsArg ? new Set(guestsArg.slice("--guests=".length).split(",").map(value => value.trim()).filter(Boolean)) : null;
const targetEpisodes = targetEpisodeId ? episodes.filter(episode => episode.id === targetEpisodeId) : episodes;
const targetGuests = targetGuestIds ? guests.filter(guest => targetGuestIds.has(guest.id)) : guests;

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

function replaceMetaContent(html, attribute, key, content) {
  const escaped = escapeHtml(content);
  const pattern = new RegExp(`<meta\\s+${attribute}="${key}"\\s+content="[^"]*">`, "i");
  return pattern.test(html) ? html.replace(pattern, `<meta ${attribute}="${key}" content="${escaped}">`) : html;
}

function isoDuration(seconds = 0) {
  const total = Number(seconds || 0);
  if (!Number.isFinite(total) || total <= 0) return "";
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const secs = Math.floor(total % 60);
  return `PT${hours ? `${hours}H` : ""}${minutes ? `${minutes}M` : ""}${secs || (!hours && !minutes) ? `${secs}S` : ""}`;
}

function formatDuration(seconds = 0) {
  const total = Number(seconds || 0);
  if (!Number.isFinite(total) || total <= 0) return "";
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const secs = Math.floor(total % 60);
  return hours ? `${hours}:${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")}` : `${minutes}:${String(secs).padStart(2, "0")}`;
}

function formatDate(value = "") {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.valueOf())) return "";
  return new Intl.DateTimeFormat("en-US", { year: "numeric", month: "long", day: "numeric", timeZone: "UTC" }).format(date);
}

function conciseOverview(value = "", fallback = "") {
  const normalized = String(value || fallback).replace(/\s+/g, " ").trim();
  if (!normalized) return "";
  return normalized.length > 420 ? `${normalized.slice(0, 417).trim()}…` : normalized;
}

function replaceApp(html, fallback) {
  if (html.includes("data-static-crawl-fallback")) return html;
  const marker = '<div id="app"></div>';
  if (!html.includes(marker)) throw new Error("Expected empty #app shell was not found.");
  return html.replace(marker, `<div id="app">${fallback}</div>`);
}

function replaceStaticFallback(html, type, fallback) {
  const pattern = new RegExp(`<main id="main-content" class="static-detail-fallback" data-static-crawl-fallback="${type}">[\\s\\S]*?<\\/main>`, "i");
  return pattern.test(html) ? html.replace(pattern, fallback) : replaceApp(html, fallback);
}

function breadcrumbs(parent, current) {
  return `<nav class="breadcrumbs" aria-label="Breadcrumb"><ol><li><a href="/">Home</a></li><li><a href="/${parent.toLowerCase()}">${escapeHtml(parent)}</a></li><li aria-current="page">${escapeHtml(current)}</li></ol></nav>`;
}

function episodeFallback(episode, html) {
  const live = liveByVideoId.get(episode.videoId) || null;
  const title = pageTitle(html) || episode.title;
  const description = pageDescription(html) || "Watch this verified conversation on The Alana Show.";
  const overview = conciseOverview(live?.description, description);
  const relatedGuests = (episode.guestIds || []).map(guestById).filter(Boolean);
  const guestLinks = relatedGuests.map(guest => `<a href="/guests/${escapeHtml(guest.id)}">${escapeHtml(guest.name)}</a>`).join(" and ");
  const date = formatDate(live?.publishedAt || "");
  const duration = formatDuration(live?.durationSeconds || 0);
  const meta = [date, duration].filter(Boolean).join(" · ");
  const categories = Array.isArray(live?.categories) ? live.categories.filter(Boolean) : [];
  const topicLinks = categories.map(category => `<a class="button button-outline" href="${escapeHtml(topicHref(category))}">${escapeHtml(category)}</a>`).join("");
  const overviewSection = overview ? `<section class="related-section" data-static-episode-overview aria-labelledby="static-overview-heading"><p class="related-eyebrow"><span></span>ABOUT THIS CONVERSATION</p><h2 id="static-overview-heading">Episode overview</h2><p>${escapeHtml(overview)}</p></section>` : "";
  const topicsSection = topicLinks ? `<section class="related-section" data-static-episode-topics aria-labelledby="static-topics-heading"><p class="related-eyebrow"><span></span>EXPLORE MORE</p><h2 id="static-topics-heading">Topics</h2><div class="detail-actions">${topicLinks}</div></section>` : "";
  return `<main id="main-content" class="static-detail-fallback" data-static-crawl-fallback="episode"><section class="detail-hero"><div class="shell detail-shell">${breadcrumbs("Episodes", title)}<p class="eyebrow"><span></span> Episode</p><h1>${escapeHtml(title)}</h1>${guestLinks ? `<p class="detail-byline">A conversation with ${guestLinks}</p>` : ""}${meta ? `<p class="detail-byline">${escapeHtml(meta)}</p>` : ""}${overviewSection}${topicsSection}<div class="detail-actions"><a class="button button-gold" href="https://www.youtube.com/watch?v=${encodeURIComponent(episode.videoId)}" target="_blank" rel="noopener">Watch on YouTube</a><a class="button button-outline" href="/episodes">More conversations</a></div></div></section></main>`;
}

function guestFallback(guest, html) {
  const title = pageTitle(html) || guest.name;
  const profile = guestProfileById(guest.id);
  const description = profile?.summary || pageDescription(html) || `Explore verified conversations featuring ${guest.name} on The Alana Show.`;
  const relatedEpisodes = (guest.episodeIds || []).map(episodeById).filter(Boolean);
  const episodeLinks = relatedEpisodes.map(episode => {
    const relatedPath = `episodes/${episode.id}/index.html`;
    const relatedTitle = fs.existsSync(path.join(ROOT, relatedPath)) ? (pageTitle(read(relatedPath)) || episode.title) : episode.title;
    return `<li><a href="/episodes/${escapeHtml(episode.id)}">${escapeHtml(relatedTitle)}</a></li>`;
  }).join("");
  const role = profile?.role ? `<p class="detail-byline">${escapeHtml(profile.role)}</p>` : "";
  const officialAction = profile?.officialUrl ? `<a class="button button-outline" href="${escapeHtml(profile.officialUrl)}" target="_blank" rel="noopener">Official profile</a>` : "";
  return `<main id="main-content" class="static-detail-fallback" data-static-crawl-fallback="guest"><section class="detail-hero"><div class="shell detail-shell">${breadcrumbs("Guests", title)}<p class="eyebrow"><span></span> Guest</p><h1>${escapeHtml(title)}</h1>${role}<p>${escapeHtml(description)}</p>${episodeLinks ? `<section class="related-section" aria-labelledby="static-related-heading"><p class="related-eyebrow"><span></span> VERIFIED ARCHIVE</p><h2 id="static-related-heading">Related conversations</h2><ul>${episodeLinks}</ul></section>` : ""}<div class="detail-actions"><a class="button button-gold" href="/episodes?guest=${encodeURIComponent(guest.name)}">View conversations</a>${officialAction}<a class="button button-outline" href="/guests">Guest directory</a></div></div></section></main>`;
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
    graph.push(videoObject);
    graph[2].mainEntity = { "@id": `${canonical}#video` };
  }
  return graph;
}

function guestGraph(guest, html) {
  const canonical = `${ORIGIN}/guests/${guest.id}`;
  const profile = guestProfileById(guest.id);
  const name = pageTitle(html) || guest.name;
  const pageTitleValue = rawPageTitle(html) || `${name} | Guest | The Alana Show`;
  const description = profile?.summary || pageDescription(html) || `Explore verified conversations featuring ${name} on The Alana Show.`;
  const person = {
    "@type": "Person",
    "@id": `${canonical}#person`,
    name,
    url: canonical,
    subjectOf: (guest.episodeIds || []).map(episodeId => ({
      "@type": "WebPage",
      "@id": `${ORIGIN}/episodes/${episodeId}#webpage`,
      url: `${ORIGIN}/episodes/${episodeId}`
    }))
  };
  if (profile?.summary) person.description = profile.summary;
  if (profile?.role) person.jobTitle = profile.role;
  if (profile?.organization) person.worksFor = { "@type": "Organization", name: profile.organization.name, url: profile.organization.url };
  if (profile?.sameAs?.length) person.sameAs = profile.sameAs;
  return [
    websiteSchema(),
    showSchema(),
    {
      "@type": "ProfilePage",
      "@id": `${canonical}#webpage`,
      url: canonical,
      name: pageTitleValue,
      description,
      isPartOf: { "@id": WEBSITE_ID },
      breadcrumb: { "@id": `${canonical}#breadcrumb` },
      mainEntity: { "@id": `${canonical}#person` }
    },
    breadcrumbSchema("Guests", name, canonical),
    person
  ];
}

let changedEpisodes = 0;
let changedGuests = 0;

for (const episode of targetEpisodes) {
  const relative = `episodes/${episode.id}/index.html`;
  const original = read(relative);
  let updated = replaceStaticFallback(original, "episode", episodeFallback(episode, original));
  updated = ensureImageAltMeta(updated, pageTitle(updated) || episode.title);
  const hasStaticDetailData = updated.includes('id="detail-structured-data"');
  if (liveByVideoId.has(episode.videoId) || !hasStaticDetailData) {
    updated = replaceStructuredData(updated, episodeGraph(episode, updated));
  }
  if (updated !== original) {
    write(relative, updated);
    changedEpisodes += 1;
  }
}

for (const guest of targetGuests) {
  const relative = `guests/${guest.id}/index.html`;
  const original = read(relative);
  const profile = guestProfileById(guest.id);
  let updated = replaceStaticFallback(original, "guest", guestFallback(guest, original));
  if (profile?.summary) {
    updated = replaceMetaContent(updated, "name", "description", profile.summary);
    updated = replaceMetaContent(updated, "property", "og:description", profile.summary);
    updated = replaceMetaContent(updated, "name", "twitter:description", profile.summary);
  }
  updated = ensureImageAltMeta(updated, `${guest.name} on The Alana Show`);
  updated = replaceStructuredData(updated, guestGraph(guest, updated));
  if (updated !== original) {
    write(relative, updated);
    changedGuests += 1;
  }
}

console.log(`Static archive backfill complete: ${changedEpisodes} episode pages, ${changedGuests} guest pages updated.`);
console.log(`Verified live video metadata matched: ${[...liveByVideoId.keys()].filter(videoId => episodes.some(episode => episode.videoId === videoId)).length}/${episodes.length}`);
