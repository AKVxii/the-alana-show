import { icon } from "../lib/icons.js";
import { escapeHtml } from "../lib/utils.js";

export function BrandedEpisodeArtwork({ compact = false } = {}) {
  return `
    <span class="branded-artwork${compact ? " branded-artwork-compact" : ""}" data-thumbnail-fallback role="img" aria-label="Alana — All Over the Place branded episode artwork">
      <span class="branded-artwork-frame" aria-hidden="true"></span>
      <span class="branded-artwork-signal" aria-hidden="true">${icon("radio")}</span>
      <span class="branded-artwork-name"><small>Alana</small><strong>All Over the Place</strong></span>
      <span class="branded-artwork-line">Real conversations. Distinct voices.</span>
    </span>
  `;
}

export function isUsableThumbnailUrl(value = "") {
  return Boolean(normalizeThumbnailUrl(value));
}

export function normalizeThumbnailUrl(value = "") {
  try {
    const url = new URL(value);
    if (url.protocol !== "https:" && url.protocol !== "http:") return "";
    if (url.hostname === "i.ytimg.com") url.hostname = "img.youtube.com";
    return url.href;
  } catch {
    return "";
  }
}

function youtubeThumbnailUrl(videoId = "", quality = "hqdefault") {
  const normalizedId = String(videoId).trim();
  return /^[A-Za-z0-9_-]{11}$/.test(normalizedId)
    ? `https://img.youtube.com/vi/${encodeURIComponent(normalizedId)}/${quality}.jpg`
    : "";
}

export function EpisodeThumbnail(episode = {}, { latest = false } = {}) {
  const derivedThumbnail = youtubeThumbnailUrl(episode.videoId);
  const thumbnail = normalizeThumbnailUrl(episode.thumbnail) || derivedThumbnail;
  const validThumbnail = isUsableThumbnailUrl(thumbnail);
  const retryThumbnail = derivedThumbnail && derivedThumbnail !== thumbnail ? derivedThumbnail : "";
  const title = episode.title || "Alana — All Over the Place conversation";
  return `
    <span class="thumbnail-media${validThumbnail ? "" : " fallback-visible"}" data-thumbnail-frame>
      ${validThumbnail ? `<img${latest ? " data-latest-image" : ""} src="${escapeHtml(thumbnail)}"${retryThumbnail ? ` data-thumbnail-retry-src="${escapeHtml(retryThumbnail)}"` : ""} alt="Thumbnail for ${escapeHtml(title)}" loading="lazy" decoding="async" referrerpolicy="no-referrer">` : ""}
      ${validThumbnail ? '<span class="thumbnail-brand" aria-hidden="true"><span>Alana — All Over the Place</span></span>' : ""}
      ${BrandedEpisodeArtwork({ compact: !latest })}
    </span>
  `;
}

export function revealThumbnailFallback(frame, image) {
  if (!frame) return;
  const retryThumbnail = image?.dataset.thumbnailRetrySrc;
  if (image && retryThumbnail && image.dataset.thumbnailRetryAttempted !== "true") {
    image.dataset.thumbnailRetryAttempted = "true";
    image.src = retryThumbnail;
    return;
  }
  if (image) {
    image.hidden = true;
    image.removeAttribute("src");
  }
  frame.classList.add("fallback-visible");
}

export function Episodes() {
  return `
    <section class="section watch-section" id="watch">
      <div class="shell">
        <div class="section-heading watch-heading">
          <div>
            <p class="eyebrow"><span></span> Watch now</p>
            <h2>Featured Conversation</h2>
          </div>
        </div>

        <div class="editorial-pair editorial-pair-minimal">
          <article class="featured-player" data-featured>
            <div class="player-frame">
              <featured-video
                data-featured-video
                data-initial-src="https://www.youtube-nocookie.com/embed/Kx7rcDzaqDk?rel=0"
                data-title="Former U.S. Senator George LeMieux | Leadership, Public Service &amp; Florida’s Future">
                <a href="/episodes/george-lemieux">Watch the George LeMieux conversation on Alana — All Over the Place</a>
              </featured-video>
            </div>
            <div class="featured-meta">
              <div>
                <span class="content-label">New this week</span>
                <h3 data-featured-title>Former U.S. Senator George LeMieux | Leadership, Public Service &amp; Florida’s Future</h3>
                <p data-featured-description>George LeMieux joins Alana K. Vandeveer for a conversation about principled leadership, public service, fiscal discipline, civic dialogue, and Florida’s future.</p>
                <div class="featured-conversation-actions">
                  <a class="button button-gold" data-featured-link href="/episodes/george-lemieux" data-track-event="Homepage Featured Conversation" data-track-location="homepage" data-track-label="George LeMieux">Explore the full conversation ${icon("arrow")}</a>
                  <a class="button button-ghost" href="/guests/george-lemieux" data-track-event="Homepage Featured Guest" data-track-location="homepage" data-track-label="George LeMieux">Meet the guest</a>
                </div>
              </div>
              <div class="featured-stats" data-featured-stats></div>
            </div>
          </article>
        </div>

        <div class="watch-tools">
          <aside class="watch-aside">
            <article class="latest-card reveal reveal-delay" data-latest>
              <div class="latest-media" data-latest-media>
                ${EpisodeThumbnail({}, { latest: true })}
              </div>
              <div class="latest-copy">
                <span class="content-label">Latest conversation</span>
                <h3 data-latest-title>The newest episode</h3>
                <p data-latest-description>New conversations appear here automatically when they are published.</p>
                <a class="button button-gold" data-latest-link href="/episodes" data-track-event="Homepage Latest Conversation" data-track-location="homepage" data-track-label="latest">
                  ${icon("play")} Explore latest episode
                </a>
              </div>
            </article>

            <button class="discovery-card reveal" type="button" data-search-open>
              <span class="discovery-icon">${icon("search")}</span>
              <span>
                <small>Want more?</small>
                <strong>Search the complete conversation archive.</strong>
              </span>
              ${icon("arrow")}
            </button>
          </aside>
        </div>

      </div>
    </section>
  `;
}
