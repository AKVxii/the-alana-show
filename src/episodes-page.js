import { MediaHeader, setupMediaNavigation } from "./components/MediaHeader.js";
import { Footer } from "./components/Footer.js";
import { site } from "./data/site.js";
import { enrichEpisode, episodes as editorialEpisodes, topics } from "./data/catalog.js";
import { episodeCard, episodeThumbnailUrl, bindThumbnailFallbacks } from "./lib/media-page.js";
import { guestEpisodes, mergeEpisodeSources, resolveCanonicalGuestName, searchEpisodes } from "./lib/episode-search.js";
import { escapeHtml } from "./lib/utils.js";
import { setupEditorialMotion } from "./lib/motion.js";
import { CANDIDATES_DISCLAIMER, resolveCollection } from "./data/collections.js";
import { lengthBucket, trackEvent } from "./lib/measurement.js";
import { loadYouTubeFeed } from "./lib/youtube-feed.js";

const FEATURED_CONVERSATION_VIDEO_ID = "Kx7rcDzaqDk";
const PAGE_SIZE = 9;
const SAVED_EPISODES_KEY = "the-alana-show:saved-conversations:v1";
const initialParams = new URLSearchParams(location.search);
const initialGuestQuery = initialParams.get("guest") || "";
const initialTopicQuery = initialParams.get("topic") || "";
const initialSort = initialParams.get("sort") || "newest";

function readSavedEpisodes() {
  try {
    const value = JSON.parse(localStorage.getItem(SAVED_EPISODES_KEY) || "[]");
    return new Set(Array.isArray(value) ? value.filter(item => typeof item === "string") : []);
  } catch {
    return new Set();
  }
}

const state = { episodes: editorialEpisodes.map(enrichEpisode), query: initialGuestQuery, guestContext: initialGuestQuery, category: initialTopicQuery, sort: initialSort, savedOnly: false, saved: readSavedEpisodes(), shown: PAGE_SIZE, usingFallback: false, loading: false };
const app = document.querySelector("#app");

app.innerHTML = `${MediaHeader()}<main id="main-content">
  <section class="media-hero flagship-archive-hero" data-episodes-hero><div class="shell media-hero-inner">
    <nav class="breadcrumbs" aria-label="Breadcrumb"><ol><li><a href="/">Home</a></li><li aria-current="page">Episodes</li></ol></nav>
    <p class="eyebrow"><span></span> The conversation archive</p><h1>Episodes</h1>
    <p>Explore conversations from The Alana Show by title, topic, or verified guest.</p>
    <div class="archive-credentials" aria-label="Conversation archive details">
      <span><strong data-library-total>—</strong> verified conversations</span>
      <span>South Florida radio</span>
      <span>Worldwide streaming</span>
    </div>
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
    <form class="archive-controls flagship-archive-controls" data-controls role="search"><label class="archive-search-field"><span>Search conversations</span><input type="search" data-query placeholder="Guest, title, or topic" autocomplete="off"></label>
      <label><span>Filter by topic</span><select data-category><option value="">All verified topics</option>${topics.map(topic => `<option>${topic}</option>`).join("")}</select></label>
      <label><span>Sort conversations</span><select data-sort><option value="newest">Newest first</option><option value="oldest">Oldest first</option><option value="title">Title A–Z</option><option value="longest">Longest first</option></select></label>
      <div class="archive-control-actions"><button type="button" class="saved-filter" data-saved-filter aria-pressed="false"><span aria-hidden="true">♡</span> Saved <b data-saved-count>0</b></button><button type="reset" class="button button-outline">Clear</button></div></form>
    <div class="topic-ribbon" aria-label="Browse conversations by topic"><span>Browse topics</span>${topics.map(topic => `<button type="button" data-topic-chip="${escapeHtml(topic)}" aria-pressed="false">${escapeHtml(topic)}</button>`).join("")}</div>
    <p class="archive-status" data-status role="status" aria-live="polite">Loading conversations…</p>
    <aside class="collection-disclaimer" data-collection-disclaimer hidden>${CANDIDATES_DISCLAIMER}</aside>
    <div class="media-grid flagship-library-grid" data-grid aria-busy="true"><div class="media-skeleton"></div><div class="media-skeleton"></div><div class="media-skeleton"></div></div>
    <div class="load-more-wrap"><button class="button button-gold" data-more hidden>Load more conversations</button></div>
  </div></section>
</main>${Footer({ fromSubpage: true })}`;

function renderFeatured() {
  const episode = state.episodes.find(item => item.videoId === FEATURED_CONVERSATION_VIDEO_ID) || state.episodes[0];
  const node = document.querySelector("[data-featured]");
  if (!episode) {
    node.innerHTML = `<p>The featured conversation is temporarily unavailable. <a href="${site.youtube}" target="_blank" rel="noopener">Visit the YouTube channel</a>.</p>`;
    return;
  }
  const url = episode.detailPath || `https://www.youtube.com/watch?v=${episode.videoId}`;
  const external = !episode.detailPath;
  node.className = "featured-conversation";
  node.innerHTML = `<div class="featured-conversation-media">${episodeCard({ ...episode, thumbnail: episodeThumbnailUrl(episode) })}</div><div class="featured-conversation-copy"><p class="content-label">New this week</p><h3>${escapeHtml(episode.title)}</h3><a class="button button-gold" href="${url}"${external ? ' target="_blank" rel="noopener"' : ""} data-track-event="Archive Featured Conversation" data-track-location="episodes-archive" data-track-label="${escapeHtml(episode.title)}">Explore the conversation</a></div>`;
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
  document.querySelectorAll("[data-topic-chip]").forEach(button => {
    button.disabled = !isAvailable;
    button.setAttribute("aria-disabled", String(!isAvailable));
  });
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

function episodeIdentifier(episode = {}) {
  return episode.detailPath || episode.videoId || episode.title || "";
}

function persistSavedEpisodes() {
  try {
    localStorage.setItem(SAVED_EPISODES_KEY, JSON.stringify([...state.saved]));
  } catch {
    // Saving remains an optional enhancement when browser storage is unavailable.
  }
}

function updateSavedControls(root = document) {
  root.querySelectorAll("[data-save-episode]").forEach(button => {
    const isSaved = state.saved.has(button.dataset.saveEpisode);
    button.setAttribute("aria-pressed", String(isSaved));
    button.innerHTML = `<span aria-hidden="true">${isSaved ? "♥" : "♡"}</span> ${isSaved ? "Saved" : "Save"}`;
    button.setAttribute("aria-label", `${isSaved ? "Remove" : "Save"} ${button.dataset.saveTitle || "conversation"}${isSaved ? " from saved conversations" : ""}`);
  });
  const savedFilter = document.querySelector("[data-saved-filter]");
  savedFilter?.setAttribute("aria-pressed", String(state.savedOnly));
  if (savedFilter) savedFilter.querySelector("span").textContent = state.savedOnly ? "♥" : "♡";
  document.querySelectorAll("[data-saved-count]").forEach(node => { node.textContent = String(state.saved.size); });
}

function bindSaveControls(root = document) {
  root.querySelectorAll("[data-save-episode]").forEach(button => {
    if (button.dataset.saveBound) return;
    button.dataset.saveBound = "true";
    button.addEventListener("click", () => {
      const id = button.dataset.saveEpisode;
      if (!id) return;
      const saveButtons = [...root.querySelectorAll("[data-save-episode]")];
      const focusIndex = Math.max(0, saveButtons.indexOf(button));
      if (state.saved.has(id)) state.saved.delete(id);
      else state.saved.add(id);
      persistSavedEpisodes();
      updateSavedControls();
      trackEvent("Conversation Save", { action: state.saved.has(id) ? "save" : "remove", saved: state.saved.size });
      if (state.savedOnly) render({ focusTarget: "saved-card", focusIndex });
    });
  });
  updateSavedControls(root);
}

function currentMatches() {
  const matches = searchEpisodes(state.episodes, state.query, state.category)
    .filter(episode => !state.savedOnly || state.saved.has(episodeIdentifier(episode)));
  return [...matches].sort((a, b) => {
    if (state.sort === "oldest") return new Date(a.publishedAt || 0) - new Date(b.publishedAt || 0);
    if (state.sort === "title") return String(a.title || "").localeCompare(String(b.title || ""));
    if (state.sort === "longest") return Number(b.durationSeconds || 0) - Number(a.durationSeconds || 0);
    return new Date(b.publishedAt || 0) - new Date(a.publishedAt || 0);
  });
}

function restoreArchiveFocus(focusTarget, focusIndex = 0) {
  if (!focusTarget) return;
  const grid = document.querySelector("[data-grid]");
  let target = null;
  if (focusTarget === "saved-card") {
    const buttons = [...grid.querySelectorAll("[data-save-episode]")];
    target = buttons[Math.min(focusIndex, Math.max(0, buttons.length - 1))]
      || grid.querySelector("[data-view-all]")
      || document.querySelector("[data-saved-filter]");
  } else if (focusTarget === "first-card") {
    target = grid.querySelector("[data-episode-primary-link]")
      || document.querySelector("[data-saved-filter]");
  }
  target?.focus({ preventScroll: true });
}

function render({ focusTarget = "", focusIndex = 0 } = {}) {
  const activeCollection = resolveCollection(state.category) || resolveCollection(state.query);
  const matches = currentMatches();
  const visible = matches.slice(0, state.shown);
  const grid = document.querySelector("[data-grid]");
  const archiveHeading = document.querySelector("#archive-heading");
  const archiveEyebrow = document.querySelector("[data-archive-eyebrow]");
  const hero = document.querySelector("[data-episodes-hero]");
  hero?.classList.toggle("media-hero-filtered", Boolean(state.category));
  archiveHeading.textContent = state.savedOnly ? "Saved conversations" : state.category ? `${state.category} conversations` : "Newest conversations";
  archiveEyebrow.innerHTML = `<span></span> ${state.savedOnly ? "Your library" : state.category ? "Selected topic" : "Browse the archive"}`;
  grid.setAttribute("aria-busy", "false");
  grid.innerHTML = visible.length ? visible.map(episode => episodeCard(episode, { savable: true })).join("") : `<div class="media-empty flagship-empty"><span aria-hidden="true">${state.savedOnly ? "♡" : "✦"}</span><h3>${state.savedOnly ? "Your saved library is ready when you are" : "No conversations found"}</h3><p>${state.savedOnly ? "Save any conversation to build a personal shortlist on this device." : "Try another title, guest, or verified topic."}</p>${state.savedOnly ? '<button class="button button-gold" type="button" data-view-all>Explore all conversations</button>' : ""}</div>`;
  const fallbackNote = state.usingFallback ? " Topic filtering is unavailable while the live feed is offline." : "";
  document.querySelector("[data-status]").textContent = `${matches.length} ${state.savedOnly ? "saved " : ""}conversation${matches.length === 1 ? "" : "s"} available.${fallbackNote}`;
  document.querySelector("[data-collection-disclaimer]").hidden = !activeCollection;
  document.querySelector("[data-more]").hidden = visible.length >= matches.length;
  document.querySelectorAll("[data-topic-chip]").forEach(button => button.setAttribute("aria-pressed", String(button.dataset.topicChip === state.category)));
  bindThumbnailFallbacks(grid);
  bindSaveControls(grid);
  grid.querySelector("[data-view-all]")?.addEventListener("click", () => {
    state.savedOnly = false;
    state.shown = PAGE_SIZE;
    render({ focusTarget: "first-card" });
  });
  setupEditorialMotion(grid);
  restoreArchiveFocus(focusTarget, focusIndex);
  return matches.length;
}

async function load() {
  try {
    const data = await loadYouTubeFeed();
    const liveEpisodes = data.episodes?.length ? data.episodes : (data.recent || []);
    state.episodes = mergeEpisodeSources(liveEpisodes, editorialEpisodes).map(enrichEpisode);
    state.usingFallback = false;
    setCategoryFilterAvailability(true);
  } catch {
    state.episodes = editorialEpisodes;
    state.usingFallback = true;
    setCategoryFilterAvailability(false);
  }
  state.loading = false;
  const total = document.querySelector("[data-library-total]");
  if (total) total.textContent = String(state.episodes.length);
  updateGuestContext();
  renderGuestResults(); renderFeatured(); render();
}

const queryInput = document.querySelector("[data-query]");
const categorySelect = document.querySelector("[data-category]");
const sortSelect = document.querySelector("[data-sort]");
queryInput.value = state.query;
categorySelect.value = state.category;
sortSelect.value = ["newest", "oldest", "title", "longest"].includes(state.sort) ? state.sort : "newest";
state.sort = sortSelect.value;
let archiveMeasureTimer = null;

function syncFilters() {
  const url = new URL(location.href);
  if (state.guestContext) url.searchParams.set("guest", state.guestContext);
  else url.searchParams.delete("guest");
  if (state.category) url.searchParams.set("topic", state.category);
  else url.searchParams.delete("topic");
  if (state.sort !== "newest") url.searchParams.set("sort", state.sort);
  else url.searchParams.delete("sort");
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
document.querySelector("[data-sort]").addEventListener("change", event => {
  state.sort = event.target.value;
  state.shown = PAGE_SIZE;
  syncFilters();
  const results = render();
  trackEvent("Archive Sort", { sort: state.sort, results });
});
document.querySelector("[data-saved-filter]").addEventListener("click", () => {
  state.savedOnly = !state.savedOnly;
  state.shown = PAGE_SIZE;
  updateSavedControls();
  const results = render();
  trackEvent("Saved Conversations Filter", { active: state.savedOnly, results });
});
document.querySelectorAll("[data-topic-chip]").forEach(button => button.addEventListener("click", () => {
  if (button.disabled) return;
  state.category = state.category === button.dataset.topicChip ? "" : button.dataset.topicChip;
  state.savedOnly = false;
  state.shown = PAGE_SIZE;
  categorySelect.value = state.category;
  syncFilters(); renderGuestResults(); renderFeatured();
  const results = render();
  trackEvent("Archive Topic Filter", { topic: state.category || "all", results, source: "topic ribbon" });
}));
document.querySelector("[data-controls]").addEventListener("reset", () => {
  state.query = ""; state.guestContext = ""; state.category = ""; state.sort = "newest"; state.savedOnly = false; state.shown = PAGE_SIZE;
  sortSelect.value = "newest";
  updateSavedControls();
  syncFilters(); renderGuestResults(); renderFeatured(); requestAnimationFrame(render);
});
document.querySelector("[data-more]").addEventListener("click", () => {
  const total = currentMatches().length;
  state.shown += PAGE_SIZE;
  render();
  trackEvent("Archive Load More", { shown: Math.min(state.shown, total), total });
});
setupMediaNavigation();
setupEditorialMotion(app);
setCategoryFilterAvailability(true);
document.querySelector("[data-library-total]").textContent = String(state.episodes.length);
updateGuestContext();
renderGuestResults();
renderFeatured();
render();
load();

window.addEventListener("popstate", () => {
  const params = new URLSearchParams(location.search);
  state.query = params.get("guest") || "";
  state.category = params.get("topic") || "";
  state.sort = params.get("sort") || "newest";
  queryInput.value = state.query;
  categorySelect.value = state.category;
  sortSelect.value = state.sort;
  state.shown = PAGE_SIZE;
  updateGuestContext(); renderGuestResults(); renderFeatured(); render();
});
