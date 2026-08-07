import { MediaHeader, setupMediaNavigation } from "./components/MediaHeader.js";
import { Footer } from "./components/Footer.js";
import { site } from "./data/site.js";
import { enrichEpisode, episodes as editorialEpisodes, topics } from "./data/catalog.js";
import { episodeCard, bindThumbnailFallbacks } from "./lib/media-page.js";
import { searchEpisodes, uniqueEpisodes } from "./lib/episode-search.js";
import { escapeHtml } from "./lib/utils.js";
import { setupEditorialMotion } from "./lib/motion.js";
import { CANDIDATES_DISCLAIMER, resolveCollection } from "./data/collections.js";

const PAGE_SIZE = 9;
const initialParams = new URLSearchParams(location.search);
const state = { episodes: [], query: initialParams.get("guest") || "", category: "", shown: PAGE_SIZE, usingFallback: false };
const app = document.querySelector("#app");

app.innerHTML = `${MediaHeader()}<main id="main-content">
  <section class="media-hero"><div class="shell media-hero-inner">
    <nav class="breadcrumbs" aria-label="Breadcrumb"><ol><li><a href="/">Home</a></li><li aria-current="page">Episodes</li></ol></nav>
    <p class="eyebrow"><span></span> The conversation archive</p><h1>Episodes</h1>
    <p>Explore conversations from The Alana Show by title, topic, or verified guest.</p>
  </div></section>
  <section class="media-section" aria-labelledby="featured-heading" data-reveal><div class="shell">
    <div class="media-section-heading"><div><p class="eyebrow dark"><span></span> Selected conversation</p><h2 id="featured-heading">Featured conversation</h2></div></div>
    <div data-featured class="featured-loading" role="status">Loading the featured conversation…</div>
  </div></section>
  <section class="media-section archive-section" aria-labelledby="archive-heading" data-reveal><div class="shell">
    <div class="media-section-heading"><div><p class="eyebrow dark"><span></span> Browse the archive</p><h2 id="archive-heading">Newest conversations</h2></div></div>
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
  node.innerHTML = `<div class="featured-conversation-media">${episodeCard(episode)}</div><div class="featured-conversation-copy"><p class="content-label">From the archive</p><h3>${escapeHtml(episode.title)}</h3><a class="button button-gold" href="${url}" target="_blank" rel="noopener">Watch on YouTube</a></div>`;
}

function setCategoryFilterAvailability(isAvailable) {
  const select = document.querySelector("[data-category]");
  select.disabled = !isAvailable;
  if (isAvailable) {
    select.removeAttribute("aria-disabled");
    select.options[0].textContent = "All verified topics";
    return;
  }
  state.category = "";
  select.value = "";
  select.setAttribute("aria-disabled", "true");
  select.options[0].textContent = "Topic filter unavailable offline";
}

function render() {
  const activeCollection = resolveCollection(state.category) || resolveCollection(state.query);
  const matches = searchEpisodes(state.episodes, state.query, state.category);
  const visible = matches.slice(0, state.shown);
  const grid = document.querySelector("[data-grid]");
  grid.setAttribute("aria-busy", "false");
  grid.innerHTML = visible.length ? visible.map(episodeCard).join("") : `<div class="media-empty"><h3>No conversations found</h3><p>Try another title, guest, or verified topic.</p></div>`;
  const fallbackNote = state.usingFallback ? " Topic filtering is unavailable while the live feed is offline." : "";
  document.querySelector("[data-status]").textContent = `${matches.length} conversation${matches.length === 1 ? "" : "s"} available.${fallbackNote}`;
  document.querySelector("[data-collection-disclaimer]").hidden = !activeCollection;
  document.querySelector("[data-more]").hidden = visible.length >= matches.length;
  bindThumbnailFallbacks(grid);
  setupEditorialMotion(grid);
}

async function load() {
  try {
    const response = await fetch("/api/youtube", { headers: { Accept: "application/json" } });
    if (!response.ok) throw new Error("feed unavailable");
    const data = await response.json();
    state.episodes = uniqueEpisodes(data.episodes || []).map(enrichEpisode);
    state.usingFallback = false;
    setCategoryFilterAvailability(true);
  } catch {
    state.episodes = editorialEpisodes;
    state.usingFallback = true;
    setCategoryFilterAvailability(false);
  }
  renderFeatured(); render();
}

document.querySelector("[data-query]").addEventListener("input", event => { state.query = event.target.value; state.shown = PAGE_SIZE; syncGuestQuery(); render(); });
document.querySelector("[data-category]").addEventListener("change", event => { state.category = event.target.value; state.shown = PAGE_SIZE; render(); });
document.querySelector("[data-controls]").addEventListener("reset", () => { state.query = ""; state.category = ""; state.shown = PAGE_SIZE; syncGuestQuery(); requestAnimationFrame(render); });
document.querySelector("[data-more]").addEventListener("click", () => { state.shown += PAGE_SIZE; render(); });
setupMediaNavigation(); setupEditorialMotion(app); load();

const queryInput = document.querySelector("[data-query]");
queryInput.value = state.query;

function syncGuestQuery() {
  const url = new URL(location.href);
  if (state.query) url.searchParams.set("guest", state.query);
  else url.searchParams.delete("guest");
  history.replaceState(null, "", `${url.pathname}${url.search}${url.hash}`);
}

window.addEventListener("popstate", () => {
  state.query = new URLSearchParams(location.search).get("guest") || "";
  queryInput.value = state.query;
  state.shown = PAGE_SIZE;
  render();
});
