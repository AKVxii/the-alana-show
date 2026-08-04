import { escapeHtml, formatDate, formatDuration } from "./utils.js";
import { EpisodeThumbnail, revealThumbnailFallback } from "../components/Episodes.js";
import { icon } from "./icons.js";

export function bindThumbnailFallbacks(root = document) {
  root.querySelectorAll("[data-thumbnail-frame]").forEach(frame => {
    const image = frame.querySelector("img");
    if (!image) return;
    image.addEventListener("error", () => revealThumbnailFallback(frame, image));
  });
}

export function episodeCard(episode) {
  const url = episode.detailPath || `https://www.youtube.com/watch?v=${encodeURIComponent(episode.videoId)}`;
  const external = !episode.detailPath;
  return `<article class="media-card">
    <a class="media-card-image" href="${url}"${external ? ' target="_blank" rel="noopener"' : ""} aria-label="View ${escapeHtml(episode.title)}">
      ${EpisodeThumbnail(episode)}<span class="episode-play">${icon("play")}</span>
    </a>
    <div class="media-card-body">
      <p class="media-card-meta">${escapeHtml(formatDate(episode.publishedAt))}${episode.durationSeconds ? ` · ${escapeHtml(formatDuration(episode.durationSeconds))}` : ""}</p>
      <h2><a href="${url}"${external ? ' target="_blank" rel="noopener"' : ""}>${escapeHtml(episode.title)}</a></h2>
      ${(episode.categories || []).length ? `<ul class="tag-list" aria-label="Topics">${episode.categories.map(item => `<li>${escapeHtml(item)}</li>`).join("")}</ul>` : ""}
    </div>
  </article>`;
}
