import { escapeHtml, formatDate, formatDuration } from "./utils.js";
import { EpisodeThumbnail, revealThumbnailFallback } from "../components/Episodes.js";
import { topicHref } from "../data/topic-pages.js";
import { icon } from "./icons.js";

export function episodeThumbnailUrl(episode = {}) {
  if (episode.thumbnail) {
    try {
      const url = new URL(episode.thumbnail);
      if (url.protocol === "https:" || url.protocol === "http:") return episode.thumbnail;
    } catch {
      // Fall back to the verified YouTube video ID below.
    }
  }
  return episode.videoId ? `https://i.ytimg.com/vi/${encodeURIComponent(episode.videoId)}/hqdefault.jpg` : "";
}

export function bindThumbnailFallbacks(root = document) {
  root.querySelectorAll("[data-thumbnail-frame]").forEach(frame => {
    const image = frame.querySelector("img");
    if (!image) return;
    image.addEventListener("error", () => revealThumbnailFallback(frame, image));
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

export function episodeCard(episode) {
  const url = episode.detailPath || `https://www.youtube.com/watch?v=${encodeURIComponent(episode.videoId)}`;
  const external = !episode.detailPath;
  return `<article class="media-card" data-reveal data-reveal-stagger="true">
    <a class="media-card-image" href="${url}"${external ? ' target="_blank" rel="noopener"' : ""} aria-label="View ${escapeHtml(episode.title)}">
      ${EpisodeThumbnail(episode)}<span class="episode-play">${icon("play")}</span>
    </a>
    <div class="media-card-body">
      <p class="media-card-meta">${escapeHtml(formatDate(episode.publishedAt))}${episode.durationSeconds ? ` · ${escapeHtml(formatDuration(episode.durationSeconds))}` : ""}</p>
      <h2><a href="${url}"${external ? ' target="_blank" rel="noopener"' : ""}>${escapeHtml(episode.title)}</a></h2>
      ${(episode.categories || []).length ? `<ul class="tag-list" aria-label="Topics">${episode.categories.map(item => `<li><a href="${topicHref(item)}">${escapeHtml(item)}</a></li>`).join("")}</ul>` : ""}
    </div>
  </article>`;
}
