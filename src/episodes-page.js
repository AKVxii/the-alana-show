import { MediaHeader, setupMediaNavigation } from "./components/MediaHeader.js";
import { Footer } from "./components/Footer.js";
import { site } from "./data/site.js";
import { enrichEpisode, episodes as editorialEpisodes, topics } from "./data/catalog.js";
import { episodeCard, episodeThumbnailUrl, bindThumbnailFallbacks } from "./lib/media-page.js";
import { guestEpisodes, resolveCanonicalGuestName, searchEpisodes, uniqueEpisodes } from "./lib/episode-search.js";
import { escapeHtml } from "./lib/utils.js";
import { setupEditorialMotion } from "./lib/motion.js";
import { CANDIDATES_DISCLAIMER, resolveCollection } from "./data/collections.js";
import { lengthBucket, trackEvent } from "./lib/measurement.js";
import { loadYouTubeFeed } from "./lib/youtube-feed.js";

const PAGE_SIZE = 9;
const initialParams = new URLSearchParams(location.search);
const initialGuestQuery = initialParams.get("guest") || "";
const initialTopicQuery = initialParams.get("topic") || "";
const state = { episodes: [], query: initialGuestQuery, guestContext: initialGuestQuery, category: initialTopicQuery, shown: PAGE_SIZE, usingFallback: false, loading: true };
const app = document.querySelector("#app");

app.innerHTML = `${MediaHeader()}<main id="main-content">
  <section class="media-hero" data-episodes-hero><div class="shell media-hero-inner">
    <nav class="breadcrumbs" aria-label="Breadcrumb"><ol><li><a href="/">Home</a></li><li aria-current="page">Episodes</li></ol></nav>
    <p class="eyebrow"><span></span> The conversation archive</p><h1>Episodes</h1>
    <p>Explore conversations from The Alana Show by title, topic, or verified guest.</p>
  </div></section>
  <section class="media-section guest-results-section" aria-labelledby="guest-results-heading" data-guest-results hidden><div class="shell">
    <div class="media-section-heading"><div><p class="eyebrow dark"><span></span> Selected guest</p><h2 id="guest-results-heading" data-guest-results-heading></h2><p class="archive-status" data-guest-results-status role="status" aria-live="polite"></p></div></div>
    <div class="media-grid" data-guest-results-grid></div>
  </div></section>
  <section class="media-section" aria-labelledby="featured-heading" data-generic-featured data-reveal><div class="shell">
    <div class="media-section-heading"><div><p class="eyebrow dark"><span></span> Selected conversation</p><h2 id="featured-heading">Featured conversation</h2></div></div>
    <div data-featured class="featured-loading" role="status">Loading the featured conversation…</div>
  </div></section>
  <section class="media-section archive-section" aria-labelledby="archive-heading" data-reveal><div class="shell">
    <div class="media-section-heading"><div><p class="eyebrow dark" data-archive-eyebrow><span></span> Browse the archive</p><h2 id="archive-heading">Newest conversations</h2></div></div>
    <form class="archive-controls" data-controls role="search"><label><span>Search conversations</span><input type="search" data-query placeholder="Guest, title, or topic" autocomplete="off"></label>
      <label><span>Filter by topic</span><select data-category><option value="">All verified topics</option>${topics.map(topic => `<option>${topic}</option>`).join("")}</select></label>
      <button type="reset" class="button button-outline">Clear</button></form>
    <p class="archive-status" data-status role="status" aria-live="polite">Loading conversations…</p>
    <aside class="collection-disclaimer" data-collection-disclaimer hidden>${CANDIDATES_DISCLAIMER}</aside>
    <div class="media-grid" data-grid aria-busy="true"><div class="media-skeleton"></div><div class="media-skeleton"></div><div class="media-skeleton"></div></div>
    <div class="load-more-wrap"><button class="button button-gold" data-more hidden>Load more conversations</button></div>
  </div></section>
</main>${Footer({ fromSubpage: true })}`;

function renderFeatured() {
  const episode = state.episodes[0];
  const node = document.querySelector("[data-featured]");
  if (!episode) {
    node.innerHTML = `<p>The featured conversation is temporarily unavailable. <a href="${site.youtube}" target="_blank" rel="noopener">Visit the YouTube channel</a>.</p>`;
    return;
  }
  const url = `https://www.youtube.com/watch?v=${episode.videoId}`;
  node.className = "featured-conversation";
  node.innerHTML = `<div class="featured-conversation-media">${episodeCard({ ...episode, thumbnail: episodeThumbnailUrl(episode) })}</div><div class="featured-conversation-copy"><p class="content-label">From the archive</p><h3>${escapeHtml(episode.title)}</h3><a class="button button-gold" href="${url}" target="_blank" rel="noopener">Watch on YouTube</a></div>`;
  bindThumbnailFallbacks(node);
}

function updateGuestContext() {
  state.guestContext = resolveCanonicalGuestName(state.episodes, state.query);
}

function focusedEpisodeCard(episode) {
  const url = episode.detailPath || `https://www.youtube.com/watch?v=${encodeURIComponent(episode.videoId)}`;
  const external = !episode.detailPath;
  return `<div class="focused-result-card">${episodeCard({ ...episode, thumbnail: episodeThumbnailUrl(episode) })}<p class="focused-result-action"><a class="button button-gold" href="${url}"${external ? ' target="_blank" rel="noopener"' : ""}>View conversation</a></p></div>`;
}

function renderGuestResults() {
  const section = document.querySelector("[data-guest-results]");
  const genericFeatured = document.querySelector("[data-generic-featured]");
  if (!state.guestContext) {
    section.hidden = true;
    genericFeatured.hidden = Boolean(state.category);
    return;
  }
  const matches = guestEpisodes(state.episodes, state.guestContext);
  section.hidden = false;
  genericFeatured.hidden = true;
  document.querySelector("[data-guest-results-heading]").textContent = `Conversations with ${state.guestContext}`;
  document.querySelector("[data-guest-results-status]").textContent = state.loading
    ? "Loading verified conversations…"
    : `${matches.length} verified conversation${matches.length === 1 ? "" : "s"}`;
  const grid = document.querySelector("[data-guest-results-grid]");
  if (state.loading) {
    grid.classList.add("guest-results-single");
    grid.innerHTML = `<div class="media-skeleton" aria-hidden="true"></div>`;
    return;
  }
  grid.classList.toggle("guest-results-single", matches.length === 1);
  grid.innerHTML = matches.map(focusedEpisodeCard).join("");
  bindThumbnailFallbacks(grid);
  setupEditorialMotion(grid);
}

function setCategoryFilterAvailability(isAvailable) {
  const select = document.querySelector("[data-category]");
  select.disabled = !isAvailable;
  if (isAvailable) {
    select.removeAttribute("aria-disabled");
    select.options[0].textContent = "All verified topics";
    select.value = topics.includes(state.category) ? state.category : "";
    if (state.category && !topics.includes(state.category)) state.category = "";
    return;
  }
  state.category = "";
  select.value = "";
  select.setAttribute("aria-disabled", "true");
  select.options[0].textContent = "Topic filter unavailable offline";
}

function currentMatches() {
  return searchEpisodes(state.episodes, state.query, state.category);
}

function render() {
  const activeCollection = resolveCollection(state.category) || resolveCollection(state.query);
  const matches = currentMatches();
  const visible = matches.slice(0, state.shown);
  const grid = document.querySelector("[data-grid]");
  const archiveHeading = document.querySelector("#archive-heading");
  const archiveEyebrow = document.querySelector("[data-archive-eyebrow]");
  const hero = document.querySelector("[data-episodes-hero]");
  hero?.classList.toggle("media-hero-filtered", Boolean(state.category));
  archiveHeading.textContent = state.category ? `${state.category} conversations` : "Newest conversations";
  archiveEyebrow.innerHTML = `<span></span> ${state.category ? "Selected topic" : "Browse the archive"}`;
  grid.setAttribute("aria-busy", "false");
  grid.innerHTML = visible.length ? visible.map(episodeCard).join("") : `<div class="media-empty"><h3>No conversations found</h3><p>Try another title, guest, or verified topic.</p></div>`;
  const fallbackNote = state.usingFallback ? " Topic filtering is unavailable while the live feed is offline." : "";
  document.querySelector("[data-status]").textContent = `${matches.length} conversation${matches.length === 1 ? "" : "s"} available.${fallbackNote}`;
  document.querySelector("[data-collection-disclaimer]").hidden = !activeCollection;
  document.querySelector("[data-more]").hidden = visible.length >= matches.length;
  bindThumbnailFallbacks(grid);
  setupEditorialMotion(grid);
  return matches.length;
}

async function load() {
  try {
    const data = await loadYouTubeFeed();
    state.episodes = uniqueEpisodes(data.episodes || []).map(enrichEpisode);
    state.usingFallback = false;
    setCategoryFilterAvailability(true);
  } catch {
    state.episodes = editorialEpisodes;
    state.usingFallback = true;
    setCategoryFilterAvailability(false);
  }
  state.loading = false;
  updateGuestContext();
  renderGuestResults(); renderFeatured(); render();
}

const queryInput = document.querySelector("[data-query]");
const categorySelect = document.querySelector("[data-category]");
queryInput.value = state.query;
categorySelect.value = state.category;
let archiveMeasureTimer = null;

function syncFilters() {
  const url = new URL(location.href);
  if (state.guestContext) url.searchParams.set("guest", state.guestContext);
  else url.searchParams.delete("guest");
  if (state.category) url.searchParams.set("topic", state.category);
  else url.searchParams.delete("topic");
  history.replaceState(null, "", `${url.pathname}${url.search}${url.hash}`);
}

document.querySelector("[data-query]").addEventListener("input", event => {
  state.query = event.target.value; state.shown = PAGE_SIZE;
  updateGuestContext(); syncFilters(); renderGuestResults(); renderFeatured();
  const results = render();
  clearTimeout(archiveMeasureTimer);
  if (state.query.trim() && !state.loading) {
    archiveMeasureTimer = setTimeout(() => {
      trackEvent("Archive Search", { length: lengthBucket(state.query), results });
    }, 650);
  }
});
document.querySelector("[data-category]").addEventListener("change", event => {
  state.category = event.target.value; state.shown = PAGE_SIZE;
  syncFilters(); renderGuestResults(); renderFeatured();
  const results = render();
  trackEvent("Archive Topic Filter", { topic: state.category || "all", results });
});
document.querySelector("[data-controls]").addEventListener("reset", () => {
  state.query = ""; state.guestContext = ""; state.category = ""; state.shown = PAGE_SIZE;
  syncFilters(); renderGuestResults(); renderFeatured(); requestAnimationFrame(render);
});
document.querySelector("[data-more]").addEventListener("click", () => {
  const total = currentMatches().length;
  state.shown += PAGE_SIZE;
  render();
  trackEvent("Archive Load More", { shown: Math.min(state.shown, total), total });
});
setupMediaNavigation(); setupEditorialMotion(app); renderGuestResults(); load();

window.addEventListener("popstate", () => {
  const params = new URLSearchParams(location.search);
  state.query = params.get("guest") || "";
  state.category = params.get("topic") || "";
  queryInput.value = state.query;
  categorySelect.value = state.category;
  state.shown = PAGE_SIZE;
  updateGuestContext(); renderGuestResults(); renderFeatured(); render();
});
