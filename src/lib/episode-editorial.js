import { EpisodeThumbnail } from "../components/Episodes.js";
import { episodeEnhancementById } from "../data/episode-enhancements.js";
import { episodeById } from "../data/catalog.js";
import { Newsletter, setupNewsletter } from "../newsletter.js";
import { icon } from "./icons.js";
import { bindThumbnailFallbacks, episodeThumbnailUrl } from "./media-page.js";
import { escapeHtml } from "./utils.js";

const EDITORIAL_GUARD = "__tasEpisodeEditorialBound";
const SITE_ORIGIN = "https://thealanashow.com";

function episodeSlug() {
  if (document.body.dataset.detailType !== "episode") return "";
  const datasetId = String(document.body.dataset.detailId || "").trim();
  if (datasetId) return datasetId;
  return location.pathname.match(/^\/episodes\/([^/?#]+)/)?.[1] || "";
}

function formatTimestamp(totalSeconds = 0) {
  const total = Math.max(0, Number(totalSeconds || 0));
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = Math.floor(total % 60);
  return hours
    ? `${hours}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`
    : `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function ensureStyles() {
  if (document.querySelector("style[data-episode-editorial-styles]")) return;
  const style = document.createElement("style");
  style.dataset.episodeEditorialStyles = "true";
  style.textContent = `
    .episode-highlights-list {
      padding: 0;
      margin: 0;
      display: grid;
      gap: 12px;
      list-style: none;
    }
    .episode-highlights-list li {
      padding: 15px 18px 15px 46px;
      position: relative;
      color: rgba(245, 247, 250, .9);
      border: 1px solid rgba(216, 184, 102, .18);
      border-radius: 10px;
      background: rgba(5, 18, 35, .54);
      line-height: 1.62;
    }
    .episode-highlights-list li::before {
      content: "";
      width: 8px;
      height: 8px;
      position: absolute;
      top: 22px;
      left: 20px;
      border-radius: 50%;
      background: var(--gold-400);
      box-shadow: 0 0 0 5px rgba(216, 184, 102, .1);
    }
    .episode-chapter-list {
      padding: 0;
      margin: 0;
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 12px;
      list-style: none;
    }
    .episode-chapter-link {
      min-height: 66px;
      padding: 14px 16px;
      display: grid;
      grid-template-columns: 58px minmax(0, 1fr);
      align-items: center;
      gap: 14px;
      color: var(--white);
      border: 1px solid rgba(216, 184, 102, .22);
      border-radius: 10px;
      background: linear-gradient(145deg, rgba(8, 25, 46, .82), rgba(3, 12, 25, .62));
      text-decoration: none;
      transition: transform .18s ease, border-color .18s ease, background .18s ease;
    }
    .episode-chapter-link:hover,
    .episode-chapter-link:focus-visible {
      transform: translateY(-1px);
      border-color: rgba(216, 184, 102, .58);
      background: linear-gradient(145deg, rgba(14, 39, 68, .92), rgba(5, 18, 35, .78));
    }
    .episode-chapter-link time {
      color: var(--gold-300);
      font-size: .78rem;
      font-weight: 800;
      letter-spacing: .045em;
    }
    .episode-chapter-link span {
      font-family: var(--serif);
      font-size: 1.02rem;
      line-height: 1.25;
    }
    .episode-guide-intro,
    .episode-related-intro {
      max-width: 78ch;
      margin: -7px 0 22px;
      color: rgba(225, 232, 241, .8);
      line-height: 1.72;
    }
    .episode-guide-list {
      display: grid;
      gap: 14px;
    }
    .episode-guide-item {
      padding: 20px;
      display: grid;
      grid-template-columns: 46px minmax(0, 1fr);
      align-items: start;
      gap: 18px;
      border: 1px solid rgba(216, 184, 102, .2);
      border-radius: 14px;
      background: linear-gradient(145deg, rgba(10, 31, 55, .8), rgba(3, 12, 25, .58));
      box-shadow: inset 0 1px 0 rgba(255, 255, 255, .025);
    }
    .episode-guide-index {
      width: 42px;
      height: 42px;
      display: grid;
      place-items: center;
      color: var(--navy-1000);
      border-radius: 50%;
      background: linear-gradient(135deg, var(--gold-300), var(--gold-500));
      font-size: .72rem;
      font-weight: 900;
      letter-spacing: .06em;
    }
    .episode-guide-copy h3 {
      margin: 0 0 8px;
      color: var(--ivory-50);
      font-size: clamp(1.28rem, 2vw, 1.62rem);
      line-height: 1.18;
    }
    .episode-guide-copy p {
      max-width: 82ch;
      margin: 0;
      color: rgba(235, 240, 247, .84);
      line-height: 1.72;
    }
    .episode-guide-jump {
      width: fit-content;
      margin-top: 12px;
      display: inline-flex;
      align-items: center;
      gap: 7px;
      color: var(--gold-300);
      text-decoration: none;
      font-size: .74rem;
      font-weight: 800;
      letter-spacing: .025em;
    }
    .episode-guide-jump:hover,
    .episode-guide-jump:focus-visible { text-decoration: underline; text-underline-offset: 4px; }
    .episode-guide-jump time { font-variant-numeric: tabular-nums; }
    .episode-related .related-conversation-list { margin-top: 22px; }
    .episode-related-card .related-conversation-copy { gap: 10px; }
    .episode-related-description {
      max-width: 660px;
      color: var(--navy-700);
      font-size: .86rem;
      line-height: 1.58;
    }
    .episode-newsletter-wrap { margin-top: 10px; }
    @media (max-width: 720px) {
      .episode-chapter-list { grid-template-columns: 1fr; }
      .episode-chapter-link { min-height: 62px; }
    }
    @media (max-width: 560px) {
      .episode-guide-item { grid-template-columns: 1fr; padding: 18px; }
      .episode-guide-index { width: 36px; height: 36px; }
    }
    @media (prefers-reduced-motion: reduce) {
      .episode-chapter-link { transition: none; }
      .episode-chapter-link:hover,
      .episode-chapter-link:focus-visible { transform: none; }
    }
  `;
  document.head.append(style);
}

function summaryMarkup(description = []) {
  return `<section class="related-section" data-episode-editorial-summary aria-labelledby="summary-heading"><p class="related-eyebrow"><span></span>ABOUT THIS CONVERSATION</p><h2 id="summary-heading">Episode overview</h2>${description.map(paragraph => `<p>${escapeHtml(paragraph)}</p>`).join("")}</section>`;
}

function highlightsMarkup(highlights = []) {
  return `<section class="related-section episode-highlights" data-episode-highlights aria-labelledby="episode-highlights-heading"><p class="related-eyebrow"><span></span>CONVERSATION HIGHLIGHTS</p><h2 id="episode-highlights-heading">What this conversation explores</h2><ul class="episode-highlights-list">${highlights.map(highlight => `<li>${escapeHtml(highlight)}</li>`).join("")}</ul></section>`;
}

function chaptersMarkup(episode, chapters = []) {
  return `<section class="related-section episode-chapters" data-episode-chapters aria-labelledby="episode-chapters-heading"><p class="related-eyebrow"><span></span>KEY MOMENTS</p><h2 id="episode-chapters-heading">Jump into the conversation</h2><ol class="episode-chapter-list">${chapters.map(chapter => {
    const timestamp = formatTimestamp(chapter.startSeconds);
    const href = `/episodes/${encodeURIComponent(episode)}?t=${chapter.startSeconds}`;
    return `<li><a class="episode-chapter-link" href="${href}" data-track-event="Episode Chapter" data-track-location="episode-page" data-track-label="${escapeHtml(`${timestamp} ${chapter.title}`)}" data-track-exclusive="true"><time datetime="PT${chapter.startSeconds}S">${timestamp}</time><span>${escapeHtml(chapter.title)}</span></a></li>`;
  }).join("")}</ol></section>`;
}

function guideMarkup(episode, guide = []) {
  return `<section class="related-section episode-guide" data-episode-guide aria-labelledby="episode-guide-heading"><p class="related-eyebrow"><span></span>EPISODE GUIDE</p><h2 id="episode-guide-heading">A closer look at the conversation</h2><p class="episode-guide-intro">These concise editorial notes are grounded in the interview and link directly to the relevant moments in the full conversation.</p><div class="episode-guide-list">${guide.map((item, index) => {
    const timestamp = formatTimestamp(item.startSeconds);
    const href = `/episodes/${encodeURIComponent(episode)}?t=${item.startSeconds}`;
    return `<article class="episode-guide-item"><span class="episode-guide-index" aria-hidden="true">${String(index + 1).padStart(2, "0")}</span><div class="episode-guide-copy"><h3>${escapeHtml(item.question)}</h3><p>${escapeHtml(item.answer)}</p><a class="episode-guide-jump" href="${href}" data-track-event="Episode Guide" data-track-location="episode-page" data-track-label="${escapeHtml(item.question)}" data-track-exclusive="true">Watch this part <time datetime="PT${item.startSeconds}S">${timestamp}</time> →</a></div></article>`;
  }).join("")}</div></section>`;
}

function relatedMarkup(related = []) {
  const cards = related.map((item, index) => {
    const episode = episodeById(item.id);
    if (!episode?.detailPath || !episode.videoId) return "";
    const title = item.title || episode.title;
    const thumbnail = episodeThumbnailUrl(episode);
    return `<article class="related-conversation" data-reveal data-reveal-stagger="true"><a class="related-conversation-card episode-related-card" href="${episode.detailPath}" aria-label="View ${escapeHtml(title)}" data-track-event="Related Conversation" data-track-location="episode-page" data-track-label="${escapeHtml(title)}" data-track-exclusive="true"><span class="related-conversation-thumb">${EpisodeThumbnail({ ...episode, title, thumbnail })}<span class="episode-play">${icon("play")}</span></span><span class="related-conversation-copy"><span class="related-conversation-sequence">CONTINUE ${String(index + 1).padStart(2, "0")}</span><span class="related-conversation-title">${escapeHtml(title)}</span>${item.description ? `<span class="episode-related-description">${escapeHtml(item.description)}</span>` : ""}<span class="related-conversation-action">View conversation →</span></span></a></article>`;
  }).filter(Boolean);

  if (!cards.length) return "";
  return `<section class="related-section episode-related" data-episode-related data-episode-editorial-related aria-labelledby="episode-related-heading"><p class="related-eyebrow"><span></span>CONTINUE WATCHING</p><h2 id="episode-related-heading">More conversations on leadership and service</h2><p class="episode-related-intro">Continue through the verified archive with conversations connected by public service, accountability, leadership, and community impact.</p><div class="related-conversation-list">${cards.join("")}</div></section>`;
}

function newsletterMarkup() {
  return `<div class="episode-newsletter-wrap" data-episode-newsletter>${Newsletter({ compact: true })}</div>`;
}

function upsertMeta(attribute, key, content) {
  let node = document.head.querySelector(`meta[${attribute}="${key}"]`);
  if (!node) {
    node = document.createElement("meta");
    node.setAttribute(attribute, key);
    document.head.append(node);
  }
  node.setAttribute("content", content);
}

function applyMetadata(episode, enhancement) {
  const concise = enhancement.description[0];
  const fullDescription = enhancement.description.join(" ");
  upsertMeta("name", "description", concise);
  upsertMeta("property", "og:description", concise);
  upsertMeta("name", "twitter:description", concise);

  const node = document.getElementById("detail-structured-data");
  if (!node) return;
  try {
    const structured = JSON.parse(node.textContent || "{}");
    const graph = structured["@graph"] || [];
    const webPage = graph.find(item => item["@type"] === "WebPage");
    const video = graph.find(item => item["@type"] === "VideoObject");
    if (webPage) webPage.description = concise;
    if (video) {
      const canonical = `${SITE_ORIGIN}/episodes/${episode}`;
      video.description = fullDescription;
      video.hasPart = enhancement.chapters.map(chapter => ({
        "@type": "Clip",
        name: chapter.title,
        startOffset: chapter.startSeconds,
        endOffset: chapter.endSeconds,
        url: `${canonical}?t=${chapter.startSeconds}`
      }));
      delete video.potentialAction;
    }
    node.textContent = JSON.stringify(structured);
  } catch {
    // Static metadata remains valid if an unexpected third-party mutation occurs.
  }
}

function applyContent(episode, enhancement) {
  const summary = document.querySelector("#episode-summary");
  if (summary && !summary.querySelector("[data-episode-editorial-summary]")) {
    summary.innerHTML = summaryMarkup(enhancement.description);
  }

  if (summary && enhancement.highlights?.length && !document.querySelector("[data-episode-highlights]")) {
    summary.insertAdjacentHTML("afterend", highlightsMarkup(enhancement.highlights));
  }

  const topics = document.querySelector("#episode-topics");
  if (topics && enhancement.chapters?.length && !document.querySelector("[data-episode-chapters]")) {
    topics.insertAdjacentHTML("afterend", chaptersMarkup(episode, enhancement.chapters));
  }

  const chapters = document.querySelector("[data-episode-chapters]");
  if (chapters && enhancement.guide?.length && !document.querySelector("[data-episode-guide]")) {
    chapters.insertAdjacentHTML("afterend", guideMarkup(episode, enhancement.guide));
  }

  const guide = document.querySelector("[data-episode-guide]");
  if (guide && enhancement.related?.length && !document.querySelector("[data-episode-editorial-related]")) {
    const curatedRelated = relatedMarkup(enhancement.related);
    const existingRelated = document.querySelector("[data-episode-related]");
    if (existingRelated) existingRelated.outerHTML = curatedRelated;
    else guide.insertAdjacentHTML("afterend", curatedRelated);
  }

  const related = document.querySelector("[data-episode-related]");
  const newsletterAnchor = related || guide || chapters;
  if (newsletterAnchor && !document.querySelector("[data-episode-newsletter]")) {
    newsletterAnchor.insertAdjacentHTML("afterend", newsletterMarkup());
  }

  const relatedNode = document.querySelector("[data-episode-related]");
  if (relatedNode) bindThumbnailFallbacks(relatedNode);
  const newsletterNode = document.querySelector("[data-episode-newsletter]");
  if (newsletterNode) setupNewsletter(newsletterNode);
}

export function setupEpisodeEditorial() {
  if (typeof window === "undefined" || window[EDITORIAL_GUARD]) return;
  const episode = episodeSlug();
  const enhancement = episodeEnhancementById(episode);
  if (!episode || !enhancement) return;

  window[EDITORIAL_GUARD] = true;
  ensureStyles();

  const apply = () => {
    applyMetadata(episode, enhancement);
    applyContent(episode, enhancement);
  };

  apply();
  const summary = document.querySelector("#episode-summary");
  if (summary) {
    const observer = new MutationObserver(() => apply());
    observer.observe(summary, { childList: true, subtree: true });
    window.addEventListener("pagehide", () => observer.disconnect(), { once: true });
  }
}
