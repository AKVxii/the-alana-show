import { MediaHeader, setupMediaNavigation } from "./components/MediaHeader.js";
import { Footer } from "./components/Footer.js";
import { episodeById, guestById, organizationById } from "./data/catalog.js";
import { escapeHtml } from "./lib/utils.js";

const root = document.querySelector("#app");
const type = document.body.dataset.detailType;
const id = document.body.dataset.detailId;
const item = type === "episode" ? episodeById(id) : guestById(id);

function breadcrumbs(current) {
  const parent = type === "episode" ? "Episodes" : "Guests";
  return `<nav class="breadcrumbs" aria-label="Breadcrumb"><ol><li><a href="/">Home</a></li><li><a href="/${parent.toLowerCase()}/">${parent}</a></li><li aria-current="page">${escapeHtml(current)}</li></ol></nav>`;
}

function episodeDetail(episode) {
  const relatedGuests = episode.guestIds.map(guestById).filter(Boolean);
  const relatedOrganizations = (episode.organizationIds || []).map(organizationById).filter(Boolean);
  const guestLinks = relatedGuests.map(guest => `<a href="/guests/${guest.id}/">${escapeHtml(guest.name)}</a>`).join(" and ");
  return `<section class="detail-hero"><div class="shell detail-shell">${breadcrumbs(episode.title)}<p class="eyebrow"><span></span> Episode</p><h1>${escapeHtml(episode.title)}</h1>
    ${guestLinks ? `<p class="detail-byline">A conversation with ${guestLinks}</p>` : ""}
    ${relatedOrganizations.length ? `<p class="detail-byline">Organization named in this conversation: ${relatedOrganizations.map(organization => escapeHtml(organization.name)).join(", ")}</p>` : ""}
    <div class="video-frame"><iframe src="https://www.youtube-nocookie.com/embed/${encodeURIComponent(episode.videoId)}?rel=0" title="${escapeHtml(episode.title)}" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe></div>
    <div class="detail-actions"><a class="button button-gold" href="https://www.youtube.com/watch?v=${encodeURIComponent(episode.videoId)}" target="_blank" rel="noopener">Watch on YouTube</a><a class="button button-outline" href="mailto:?subject=${encodeURIComponent(episode.title)}&body=${encodeURIComponent(location.href)}">Share by email</a></div>
  </div></section>`;
}

function guestDetail(guest) {
  const related = guest.episodeIds.map(episodeById).filter(Boolean);
  return `<section class="detail-hero"><div class="shell detail-shell">${breadcrumbs(guest.name)}<p class="eyebrow"><span></span> Guest</p><h1>${escapeHtml(guest.name)}</h1>
    <div class="guest-detail-intro"><div class="guest-monogram guest-monogram-large" aria-hidden="true">${escapeHtml(guest.name.split(/\s+/).map(part => part[0]).slice(0, 2).join(""))}</div><p>Verified conversations featuring ${escapeHtml(guest.name)}.</p></div>
    ${related.length ? `<section class="related-section" aria-labelledby="related-heading"><h2 id="related-heading">Related conversations</h2>${related.map(episode => `<article><h3><a href="${episode.detailPath}">${escapeHtml(episode.title)}</a></h3></article>`).join("")}</section>` : ""}
  </div></section>`;
}

root.innerHTML = `${MediaHeader()}<main id="main-content">${type === "episode" ? episodeDetail(item) : guestDetail(item)}</main>${Footer({ fromSubpage: true })}`;
setupMediaNavigation();
