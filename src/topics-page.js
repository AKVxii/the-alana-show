import { MediaHeader, setupMediaNavigation } from "./components/MediaHeader.js";
import { Footer } from "./components/Footer.js";
import { site } from "./data/site.js";
import { topicHref } from "./data/topic-pages.js";
import { escapeHtml } from "./lib/utils.js";
import { setupEditorialMotion } from "./lib/motion.js";
import { loadYouTubeFeed } from "./lib/youtube-feed.js";

const topicDescriptions = {
  "2026 Candidates Special": "Verified candidate conversations and election-focused interviews from the current special series.",
  "Leadership": "Conversations about responsibility, decision-making, service, and the people who lead through action.",
  "Community": "Local voices, organizations, and people working to strengthen the communities around them.",
  "Business": "Entrepreneurship, growth, innovation, ownership, and the lessons behind building something that lasts.",
  "Public Service": "Conversations with public servants and civic leaders about service, responsibility, and public life.",
  "Faith & Purpose": "Stories shaped by faith, conviction, resilience, calling, and a larger sense of purpose.",
  "Wellness": "Health, performance, fitness, care, and the people working to improve how others live and feel.",
  "Technology": "Artificial intelligence, cybersecurity, digital change, and the technologies reshaping work and life.",
  "Stepping Up": "People who answered a need, took responsibility, and chose to make a meaningful difference."
};

const app = document.querySelector("#app");

function topicCard(topic) {
  return `<a class="topic-card" href="${topicHref(topic)}" data-topic-card="${escapeHtml(topic)}" data-reveal data-reveal-stagger="true">
    <span class="topic-card-kicker">Explore topic</span>
    <h2>${escapeHtml(topic)}</h2>
    <p>${escapeHtml(topicDescriptions[topic] || "Browse conversations from The Alana Show connected to this verified topic.")}</p>
    <span class="topic-card-footer"><span data-topic-count="${escapeHtml(topic)}">Browse conversations</span><span aria-hidden="true">→</span></span>
  </a>`;
}

app.innerHTML = `${MediaHeader()}<main id="main-content">
  <section class="media-hero topics-hero"><div class="shell media-hero-inner">
    <nav class="breadcrumbs" aria-label="Breadcrumb"><ol><li><a href="/">Home</a></li><li aria-current="page">Topics</li></ol></nav>
    <p class="eyebrow"><span></span> Discover the archive</p><h1>Topics</h1>
    <p>Follow the ideas, issues, and areas of expertise that connect conversations across The Alana Show.</p>
  </div></section>

  <aside class="archive-signature" aria-label="A note from Alana">
    <div class="shell archive-signature-inner">
      <p class="archive-signature-kicker">A note from Alana</p>
      <p class="archive-signature-quote"><span>The Alana Show…</span> <em>all over the map so you don’t have to be.</em></p>
    </div>
  </aside>

  <section class="media-section topics-section" aria-labelledby="topics-heading"><div class="shell">
    <div class="media-section-heading topics-heading" data-reveal><div><p class="eyebrow dark"><span></span> Explore by subject</p><h2 id="topics-heading">Find the conversations that matter to you</h2></div><p>Choose a topic to open a permanent editorial collection of related conversations.</p></div>
    <div class="topics-grid" data-topics-grid>${site.topics.map(topicCard).join("")}</div>
  </div></section>
  <section class="topics-cta"><div class="shell topics-cta-inner" data-reveal><div><p class="eyebrow"><span></span> Looking for someone specific?</p><h2>Browse the people behind the conversations.</h2></div><div class="topics-cta-actions"><a class="button button-gold" href="/guests/">Guest Directory</a><a class="button button-ghost" href="/episodes/">All Episodes</a></div></div></section>
</main>${Footer({ fromSubpage: true })}`;

setupMediaNavigation();
setupEditorialMotion(app);

async function loadTopicCounts() {
  try {
    const data = await loadYouTubeFeed();
    const episodes = Array.isArray(data.episodes) ? data.episodes : [];
    site.topics.forEach(topic => {
      const count = episodes.filter(episode => Array.isArray(episode.categories) && episode.categories.includes(topic)).length;
      const node = document.querySelector(`[data-topic-count="${CSS.escape(topic)}"]`);
      if (node && count) node.textContent = `${count} conversation${count === 1 ? "" : "s"}`;
    });
  } catch {
    // The topic hub remains fully usable when live counts are unavailable.
  }
}

loadTopicCounts();
