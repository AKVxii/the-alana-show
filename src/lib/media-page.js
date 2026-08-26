import { escapeHtml, formatDate, formatDuration } from "./utils.js";
import { EpisodeThumbnail, normalizeThumbnailUrl, revealThumbnailFallback } from "../components/Episodes.js";
import { topicHref } from "../data/topic-pages.js";
import { icon } from "./icons.js";

if (typeof document !== "undefined" && !document.querySelector("#topic-authority-link-style")) {
  const style = document.createElement("style");
  style.id = "topic-authority-link-style";
  style.textContent = `
    .tag-list a { display: block; margin: -4px -9px; padding: 4px 9px; color: inherit; border-radius: 999px; text-decoration: none; }
    .tag-list a:focus-visible { outline: 2px solid var(--gold-500); outline-offset: 2px; }
  `;
  document.head.append(style);
}

export function episodeThumbnailUrl(episode = {}) {
  const thumbnail = normalizeThumbnailUrl(episode.thumbnail);
  if (thumbnail) return thumbnail;
  return episode.videoId ? `https://img.youtube.com/vi/${encodeURIComponent(episode.videoId)}/hqdefault.jpg` : "";
}

export function bindThumbnailFallbacks(root = document) {
  root.querySelectorAll("[data-thumbnail-frame]").forEach(frame => {
    const image = frame.querySelector("img");
    if (!image || image.dataset.fallbackBound === "true") return;
    image.dataset.fallbackBound = "true";
    image.addEventListener("error", () => revealThumbnailFallback(frame, image));
    if (image.complete && image.naturalWidth === 0) revealThumbnailFallback(frame, image);
  });
}

export function relatedConversationRow(episode, index = 0) {
  const sequence = String(index + 1).padStart(2, "0");
  return `<article class="related-conversation" data-reveal data-reveal-stagger="true">
    <a class="related-conversation-card" href="${episode.detailPath}" aria-label="View ${escapeHtml(episode.title)}">
      <span class="related-conversation-thumb">
        ${EpisodeThumbnail({ ...episode, thumbnail: episodeThumbnailUrl(episode) })}<span class="episode-play">${icon("play")}</span>
      </span>
      <span class="related-conversation-copy">
        <span class="related-conversation-sequence">CONVERSATION ${sequence}</span>
        <span class="related-conversation-title">${escapeHtml(episode.title)}</span>
        <span class="related-conversation-action">View conversation →</span>
      </span>
    </a>
  </article>`;
}

export function episodeCard(episode, { savable = false } = {}) {
  const url = episode.detailPath || `https://www.youtube.com/watch?v=${encodeURIComponent(episode.videoId)}`;
  const external = !episode.detailPath;
  const episodeId = episode.detailPath || episode.videoId || episode.title;
  const destinationAttrs = `href="${url}"${external ? ' target="_blank" rel="noopener"' : ""}`;
  const media = savable
    ? `<div class="media-card-image">${EpisodeThumbnail(episode)}<span class="episode-play" aria-hidden="true">${icon("play")}</span></div>`
    : `<a class="media-card-image" ${destinationAttrs} aria-label="View ${escapeHtml(episode.title)}">${EpisodeThumbnail(episode)}<span class="episode-play">${icon("play")}</span></a>`;
  return `<article class="media-card" data-reveal data-reveal-stagger="true" data-episode-card="${escapeHtml(episodeId)}">
    ${media}
    <div class="media-card-body">
      <p class="media-card-meta">${escapeHtml(formatDate(episode.publishedAt))}${episode.durationSeconds ? ` · ${escapeHtml(formatDuration(episode.durationSeconds))}` : ""}</p>
      <h2><a ${destinationAttrs}${savable ? ' data-episode-primary-link' : ""}>${escapeHtml(episode.title)}</a></h2>
      ${(episode.categories || []).length ? `<ul class="tag-list" aria-label="Topics">${episode.categories.map(item => `<li><a href="${topicHref(item)}">${escapeHtml(item)}</a></li>`).join("")}</ul>` : ""}
      ${savable ? `<div class="media-card-actions"><button type="button" class="save-conversation" data-save-episode="${escapeHtml(episodeId)}" data-save-title="${escapeHtml(episode.title)}" aria-pressed="false"><span aria-hidden="true">♡</span> Save</button></div>` : ""}
    </div>
  </article>`;
}
