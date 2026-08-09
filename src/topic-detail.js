import { MediaHeader, setupMediaNavigation } from "./components/MediaHeader.js";
import { Footer } from "./components/Footer.js";
import { enrichEpisode } from "./data/catalog.js";
import { topicPageById } from "./data/topic-pages.js";
import { bindThumbnailFallbacks, episodeCard } from "./lib/media-page.js";
import { escapeHtml } from "./lib/utils.js";
import { setupEditorialMotion } from "./lib/motion.js";
import { loadYouTubeFeed } from "./lib/youtube-feed.js";

const app = document.querySelector("#app");
const topicId = document.body.dataset.topicId;
const topic = topicPageById(topicId);

// Topic authority pages use the compact Topics hero, but the global site header is
// fixed at 66px. Keep the breadcrumb comfortably below it without making the hero
// materially taller by trading bottom padding for the extra top clearance.
const topicDetailStyle = document.createElement("style");
topicDetailStyle.textContent = `
  body[data-topic-id] .topics-hero { padding-top: 82px; padding-bottom: 0; }
  @media (max-width: 980px) {
    body[data-topic-id] .topics-hero { padding-top: 78px; padding-bottom: 0; }
  }
  @media (max-width: 640px) {
    body[data-topic-id] .topics-hero { padding-top: 76px; padding-bottom: 0; }
  }
`;
document.head.append(topicDetailStyle);

if (!topic) {
  location.replace("/topics/");
} else {
  app.innerHTML = `${MediaHeader()}<main id="main-content">
    <section class="media-hero topics-hero"><div class="shell media-hero-inner">
      <nav class="breadcrumbs" aria-label="Breadcrumb"><ol><li><a href="/">Home</a></li><li><a href="/topics/">Topics</a></li><li aria-current="page">${escapeHtml(topic.name)}</li></ol></nav>
      <p class="eyebrow"><span></span> Topic archive</p>
      <h1>${escapeHtml(topic.title)}</h1>
      <p>${escapeHtml(topic.intro)}</p>
    </div></section>

    <section class="media-section topics-section" aria-labelledby="topic-conversations-heading"><div class="shell">
      <div class="media-section-heading topics-heading" data-reveal>
        <div><p class="eyebrow dark"><span></span> Curated conversations</p><h2 id="topic-conversations-heading">${escapeHtml(topic.heading)}</h2></div>
        <p>Browse verified conversations connected to ${escapeHtml(topic.name)}. New relevant episodes are added here as the archive grows.</p>
      </div>
      <p class="archive-status" data-topic-status role="status" aria-live="polite">Loading ${escapeHtml(topic.name)} conversations…</p>
      <div class="media-grid" data-topic-grid></div>
    </div></section>

    <section class="topics-cta"><div class="shell topics-cta-inner" data-reveal>
      <div><p class="eyebrow"><span></span> Keep exploring</p><h2>Follow the people and ideas behind the conversation.</h2></div>
      <div class="topics-cta-actions"><a class="button button-gold" href="/topics/">All Topics</a><a class="button button-ghost" href="/episodes/?topic=${encodeURIComponent(topic.name)}">Open Archive Filter</a></div>
    </div></section>
  </main>${Footer({ fromSubpage: true })}`;

  setupMediaNavigation();
  setupEditorialMotion(app);
  loadTopicEpisodes();
}

async function loadTopicEpisodes() {
  const grid = document.querySelector("[data-topic-grid]");
  const status = document.querySelector("[data-topic-status]");
  if (!grid || !status || !topic) return;

  try {
    const payload = await loadYouTubeFeed();
    const episodes = (Array.isArray(payload.episodes) ? payload.episodes : [])
      .filter(episode => Array.isArray(episode.categories) && episode.categories.includes(topic.name))
      .map(enrichEpisode)
      .sort((a, b) => String(b.publishedAt || "").localeCompare(String(a.publishedAt || "")));

    if (!episodes.length) {
      status.textContent = `No ${topic.name} conversations are classified in the live archive yet.`;
      grid.innerHTML = `<div class="media-empty"><h3>The archive is growing.</h3><p>Browse all conversations while this topic collection develops.</p><a class="button button-gold" href="/episodes/">Browse all episodes</a></div>`;
      return;
    }

    status.textContent = `${episodes.length} ${topic.name} conversation${episodes.length === 1 ? "" : "s"}.`;
    grid.innerHTML = episodes.map(episodeCard).join("");
    bindThumbnailFallbacks(grid);
    setupEditorialMotion(grid);
  } catch {
    status.textContent = "The live conversation list is temporarily unavailable.";
    grid.innerHTML = `<div class="media-empty"><h3>Continue in the archive.</h3><p>The topic page remains available while the live feed reconnects.</p><a class="button button-gold" href="/episodes/?topic=${encodeURIComponent(topic.name)}">Browse ${escapeHtml(topic.name)} conversations</a></div>`;
  }
}
