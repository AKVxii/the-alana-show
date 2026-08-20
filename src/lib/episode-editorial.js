import { episodeEnhancementById } from "../data/episode-enhancements.js";
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
    @media (max-width: 720px) {
      .episode-chapter-list { grid-template-columns: 1fr; }
      .episode-chapter-link { min-height: 62px; }
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
