import { episodeEnhancementById } from "../data/episode-enhancements.js";

const PROMOTION_GUARD = "__tasEpisodePromotionBound";
const PREFERRED_MOMENTS = [
  "Why Character Is Everything",
  "America’s Debt and Fiscal Discipline",
  "Listening Across Political Divides"
];

function episodeSlug() {
  if (document.body.dataset.detailType !== "episode") return "";
  const datasetId = String(document.body.dataset.detailId || "").trim();
  if (datasetId) return datasetId;
  return location.pathname.match(/^\/episodes\/([^/?#]+)/)?.[1] || "";
}

function timestamp(totalSeconds = 0) {
  const total = Math.max(0, Number(totalSeconds || 0));
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = Math.floor(total % 60);
  return hours
    ? `${hours}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`
    : `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function escapeHtml(value = "") {
  return String(value).replace(/[&<>"']/g, character => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  })[character]);
}

export function selectPromotionMoments(enhancement = {}) {
  const chapters = Array.isArray(enhancement.chapters) ? enhancement.chapters : [];
  const chapterByTitle = new Map(chapters.map(chapter => [chapter.title, chapter]));
  return PREFERRED_MOMENTS
    .map(title => chapterByTitle.get(title))
    .filter(Boolean)
    .map(chapter => ({
      title: chapter.title,
      startSeconds: Number(chapter.startSeconds || 0)
    }));
}

function ensureStyles() {
  if (document.querySelector('link[data-episode-promotion-style]')) return;
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = "/src/episode-promotion.css?v=1";
  link.dataset.episodePromotionStyle = "true";
  document.head.append(link);
}

export function setupEpisodePromotion() {
  if (typeof window === "undefined" || window[PROMOTION_GUARD]) return;
  const episode = episodeSlug();
  const enhancement = episodeEnhancementById(episode);
  const moments = selectPromotionMoments(enhancement);
  const actions = document.querySelector("[data-episode-primary-actions]");
  if (!episode || !actions || moments.length < 2) return;

  window[PROMOTION_GUARD] = true;
  ensureStyles();

  const section = document.createElement("section");
  section.className = "episode-promotion";
  section.dataset.episodePromotion = "true";
  section.setAttribute("aria-labelledby", "episode-promotion-heading");
  section.innerHTML = `
    <div class="episode-promotion-copy">
      <p class="related-eyebrow"><span></span>START WITH A KEY MOMENT</p>
      <h2 id="episode-promotion-heading">Three moments worth hearing</h2>
      <p>Begin with a focused segment, then continue through the complete conversation.</p>
    </div>
    <nav class="episode-promotion-grid" aria-label="Featured moments from this conversation">
      ${moments.map(moment => {
        const label = `${timestamp(moment.startSeconds)} ${moment.title}`;
        return `<a href="/episodes/${encodeURIComponent(episode)}?t=${moment.startSeconds}" data-track-event="Episode Featured Moment" data-track-location="episode-page" data-track-label="${escapeHtml(label)}" data-track-exclusive="true"><time datetime="PT${moment.startSeconds}S">${timestamp(moment.startSeconds)}</time><span>${escapeHtml(moment.title)}</span><small>Watch this moment →</small></a>`;
      }).join("")}
    </nav>`;

  actions.insertAdjacentElement("afterend", section);
}
