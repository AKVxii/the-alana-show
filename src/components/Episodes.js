import { icon } from "../lib/icons.js";
import { escapeHtml } from "../lib/utils.js";

export function BrandedEpisodeArtwork({ compact = false } = {}) {
  return `
    <span class="branded-artwork${compact ? " branded-artwork-compact" : ""}" data-thumbnail-fallback role="img" aria-label="The Alana Show branded episode artwork">
      <span class="branded-artwork-frame" aria-hidden="true"></span>
      <span class="branded-artwork-signal" aria-hidden="true">${icon("radio")}</span>
      <span class="branded-artwork-name"><small>The</small><strong>Alana Show</strong></span>
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
  const title = episode.title || "The Alana Show conversation";
  return `
    <span class="thumbnail-media${validThumbnail ? "" : " fallback-visible"}" data-thumbnail-frame>
      ${validThumbnail ? `<img${latest ? " data-latest-image" : ""} src="${escapeHtml(thumbnail)}"${retryThumbnail ? ` data-thumbnail-retry-src="${escapeHtml(retryThumbnail)}"` : ""} alt="Thumbnail for ${escapeHtml(title)}" loading="lazy" decoding="async" referrerpolicy="no-referrer">` : ""}
      ${validThumbnail ? '<span class="thumbnail-brand" aria-hidden="true"><span>The Alana Show</span></span>' : ""}
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
                data-initial-src="https://www.youtube-nocookie.com/embed/SqRazfeMcTk?rel=0"
                data-title="Palm Beach County Sheriff Ric Bradshaw on Flock Cameras, Amendment 3 &amp; Budget">
                <a href="/episodes/ric-bradshaw">Watch the Sheriff Ric Bradshaw conversation on The Alana Show</a>
              </featured-video>
            </div>
            <div class="featured-meta">
              <div>
                <span class="content-label">New this week</span>
                <h3 data-featured-title>Palm Beach County Sheriff Ric Bradshaw on Flock Cameras, Amendment 3 &amp; Budget</h3>
                <p data-featured-description>Sheriff Ric Bradshaw joins Alana K. Vandeveer for a candid conversation about the Sheriff’s Office budget, Flock cameras, Amendment 3, public safety, and privacy concerns.</p>
                <div class="featured-conversation-actions">
                  <a class="button button-gold" data-featured-link href="/episodes/ric-bradshaw" data-track-event="Homepage Featured Conversation" data-track-location="homepage" data-track-label="Sheriff Ric Bradshaw">Explore the full conversation ${icon("arrow")}</a>
                  <a class="button button-ghost" href="/guests/ric-bradshaw" data-track-event="Homepage Featured Guest" data-track-location="homepage" data-track-label="Sheriff Ric Bradshaw">Meet the guest</a>
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
                <span class="content-label">More from the archive</span>
                <h3 data-latest-title>Continue watching</h3>
                <p data-latest-description>Explore another conversation from The Alana Show.</p>
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
