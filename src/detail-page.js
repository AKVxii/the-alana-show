import { MediaHeader, setupMediaNavigation } from "./components/MediaHeader.js";
import { Footer } from "./components/Footer.js";
import { episodeById, guestById, organizationById, enrichEpisode } from "./data/catalog.js";
import { escapeHtml } from "./lib/utils.js";
import { bindThumbnailFallbacks, relatedConversationRow } from "./lib/media-page.js";
import { setupEditorialMotion } from "./lib/motion.js";

const compactDetailStyles = document.createElement("style");
compactDetailStyles.textContent = `
  .detail-hero { padding: 84px 0 42px; }
  .detail-hero .breadcrumbs { margin-bottom: 20px; }
  .detail-hero h1 {
    max-width: 860px;
    margin-bottom: 12px;
    font-size: clamp(2rem, 3.2vw, 3.15rem);
    line-height: 1.03;
    letter-spacing: -.028em;
    text-wrap: balance;
  }
  .detail-byline { margin-bottom: 20px; font-size: .98rem; }
  .guest-detail-intro { padding: 18px 0; gap: 18px; }
  .guest-monogram-large { width: 82px; height: 82px; flex: 0 0 82px; font-size: 1.6rem; }
  .related-section { padding-top: 18px; margin-top: 14px; }
  @media (max-width: 640px) {
    .detail-hero { padding: 90px 0 36px; }
    .detail-hero .breadcrumbs { margin-bottom: 18px; }
    .detail-hero h1 { font-size: clamp(1.9rem, 9vw, 2.55rem); line-height: 1.04; }
    .guest-detail-intro { padding: 16px 0; }
  }
`;
document.head.append(compactDetailStyles);

const root = document.querySelector("#app");
const type = document.body.dataset.detailType;
const pathId = location.pathname.split("/").filter(Boolean).pop();
const id = document.body.dataset.detailId || pathId;
const item = type === "episode" ? episodeById(id) : guestById(id);

function breadcrumbs(current) {
  const parent = type === "episode" ? "Episodes" : "Guests";
  return `<nav class="breadcrumbs" aria-label="Breadcrumb"><ol><li><a href="/">Home</a></li><li><a href="/${parent.toLowerCase()}">${parent}</a></li><li aria-current="page">${escapeHtml(current)}</li></ol></nav>`;
}

function formatDuration(seconds = 0) {
  const total = Number(seconds || 0);
  if (!total) return "";
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const secs = total % 60;
  return hours ? `${hours}:${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")}` : `${minutes}:${String(secs).padStart(2, "0")}`;
}

function formatDate(value = "") {
  if (!value) return "";
  const date = new Date(value);
  return Number.isNaN(date.valueOf()) ? "" : new Intl.DateTimeFormat("en-US", { year: "numeric", month: "long", day: "numeric" }).format(date);
}

function episodeDetail(episode) {
  const relatedGuests = episode.guestIds.map(guestById).filter(Boolean);
  const relatedOrganizations = (episode.organizationIds || []).map(organizationById).filter(Boolean);
  const guestLinks = relatedGuests.map(guest => `<a href="/guests/${guest.id}">${escapeHtml(guest.name)}</a>`).join(" and ");
  return `<section class="detail-hero"><div class="shell detail-shell">${breadcrumbs(episode.title)}<p class="eyebrow"><span></span> Episode</p><h1 id="episode-title">${escapeHtml(episode.title)}</h1>
    ${guestLinks ? `<p class="detail-byline">A conversation with ${guestLinks}</p>` : ""}
    <p class="detail-byline" id="episode-meta" hidden></p>
    ${relatedOrganizations.length ? `<p class="detail-byline">Organization named in this conversation: ${relatedOrganizations.map(organization => escapeHtml(organization.name)).join(", ")}</p>` : ""}
    <div class="video-frame"><iframe src="https://www.youtube-nocookie.com/embed/${encodeURIComponent(episode.videoId)}?rel=0" title="${escapeHtml(episode.title)}" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe></div>
    <div id="episode-summary"></div>
    <div id="episode-topics"></div>
    <div class="detail-actions"><a class="button button-gold" href="https://www.youtube.com/watch?v=${encodeURIComponent(episode.videoId)}" target="_blank" rel="noopener">Watch on YouTube</a><a class="button button-outline" href="/episodes">More conversations</a><a class="button button-outline" href="mailto:?subject=${encodeURIComponent(episode.title)}&body=${encodeURIComponent(location.href)}">Share by email</a></div>
  </div></section>`;
}

function guestDetail(guest) {
  const related = (guest.episodeIds || []).map(episodeById).filter(Boolean);
  const count = guest.conversationCount || related.length;
  const archiveHref = `/episodes?guest=${encodeURIComponent(guest.name)}`;
  const countLabel = count === 1 ? "1 verified conversation" : `${count} verified conversations`;
  return `<section class="detail-hero"><div class="shell detail-shell">${breadcrumbs(guest.name)}<p class="eyebrow"><span></span> Guest</p><h1>${escapeHtml(guest.name)}</h1>
    <div class="guest-detail-intro" data-reveal><div class="guest-monogram guest-monogram-large" aria-hidden="true">${escapeHtml(guest.name.split(/\s+/).map(part => part[0]).slice(0, 2).join(""))}</div><div><p>${escapeHtml(countLabel)} featuring ${escapeHtml(guest.name)} on The Alana Show.</p><div class="detail-actions"><a class="button button-gold" href="${archiveHref}">View conversations</a><a class="button button-outline" href="/guests">Guest directory</a></div></div></div>
    ${related.length ? `<section class="related-section" aria-labelledby="related-heading"><div data-reveal><p class="related-eyebrow"><span></span>${escapeHtml(guest.name.toUpperCase())} ARCHIVE</p><h2 id="related-heading">Related conversations</h2></div><div class="related-conversation-list">${related.map(relatedConversationRow).join("")}</div></section>` : ""}
  </div></section>`;
}

async function hydrateEpisode(episode) {
  try {
    const response = await fetch("/api/youtube");
    if (!response.ok) return;
    const payload = await response.json();
    const live = (payload.episodes || []).find(candidate => candidate.videoId === episode.videoId);
    if (!live) return;
    const enriched = enrichEpisode(live);
    const titleNode = document.querySelector("#episode-title");
    if (titleNode && enriched.title) titleNode.textContent = enriched.title;
    document.title = `${enriched.title || episode.title} | The Alana Show`;

    const date = formatDate(enriched.publishedAt);
    const duration = formatDuration(enriched.durationSeconds);
    const metaParts = [date, duration].filter(Boolean);
    const metaNode = document.querySelector("#episode-meta");
    if (metaNode && metaParts.length) {
      metaNode.textContent = metaParts.join(" · ");
      metaNode.hidden = false;
    }

    const summaryNode = document.querySelector("#episode-summary");
    if (summaryNode && enriched.description) {
      const summary = enriched.description.length > 420 ? `${enriched.description.slice(0, 417).trim()}…` : enriched.description;
      summaryNode.innerHTML = `<section class="related-section" aria-labelledby="summary-heading"><p class="related-eyebrow"><span></span>ABOUT THIS CONVERSATION</p><h2 id="summary-heading">Episode overview</h2><p>${escapeHtml(summary)}</p></section>`;
    }

    const topicNode = document.querySelector("#episode-topics");
    if (topicNode && enriched.categories?.length) {
      topicNode.innerHTML = `<section class="related-section" aria-labelledby="topics-heading"><p class="related-eyebrow"><span></span>EXPLORE MORE</p><h2 id="topics-heading">Topics</h2><div class="detail-actions">${enriched.categories.map(category => `<a class="button button-outline" href="/episodes?topic=${encodeURIComponent(category)}">${escapeHtml(category)}</a>`).join("")}</div></section>`;
    }
  } catch {
    // Static verified episode data keeps the page useful if the live feed is unavailable.
  }
}

if (!item) {
  root.innerHTML = `${MediaHeader()}<main id="main-content"><section class="detail-hero"><div class="shell detail-shell"><p class="eyebrow"><span></span> Archive</p><h1>Profile unavailable</h1><p>This verified archive profile is not available.</p><div class="detail-actions"><a class="button button-gold" href="/episodes">Episodes</a></div></div></section></main>${Footer({ fromSubpage: true })}`;
} else {
  root.innerHTML = `${MediaHeader()}<main id="main-content">${type === "episode" ? episodeDetail(item) : guestDetail(item)}</main>${Footer({ fromSubpage: true })}`;
}
setupMediaNavigation();
bindThumbnailFallbacks(root);
setupEditorialMotion(root);
if (type === "episode" && item) hydrateEpisode(item);
