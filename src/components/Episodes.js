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
                data-initial-src="https://www.youtube-nocookie.com/embed/OMIQxss58UE?rel=0"
                data-title="Sheriff Grady Judd on Flock Cameras, Amendment 3 &amp; Florida Property-Tax Reform">
                <a href="/episodes/grady-judd">Watch the Sheriff Grady Judd conversation on The Alana Show</a>
              </featured-video>
            </div>
            <div class="featured-meta">
              <div>
                <span class="content-label">New this week</span>
                <h3 data-featured-title>Sheriff Grady Judd on Flock Cameras, Amendment 3 &amp; Florida Property-Tax Reform</h3>
                <p data-featured-description>Polk County Sheriff Grady Judd joins Alana K. Vandeveer to discuss property-tax reform, Amendment 3, Flock license-plate readers, public safety, privacy, crime reduction, and growth.</p>
                <div class="featured-conversation-actions">
                  <a class="button button-gold" data-featured-link href="/episodes/grady-judd" data-track-event="Homepage Featured Conversation" data-track-location="homepage" data-track-label="Sheriff Grady Judd">Explore the full conversation ${icon("arrow")}</a>
                  <a class="button button-ghost" href="/guests/grady-judd" data-track-event="Homepage Featured Guest" data-track-location="homepage" data-track-label="Sheriff Grady Judd">Meet the guest</a>
                </div>
              </div>
              <div class="featured-stats" data-featured-stats></div>
            </div>
          </article>
        </div>

        <section class="archive-spotlight" aria-labelledby="archive-spotlight-heading">
          <div class="archive-spotlight-heading">
            <div>
              <p class="eyebrow"><span></span> From the archives</p>
              <h3 id="archive-spotlight-heading">Conversations worth revisiting</h3>
            </div>
            <a href="/episodes" class="archive-spotlight-all">Explore the full archive ${icon("arrow")}</a>
          </div>
          <div class="archive-spotlight-grid">
            <article class="archive-spotlight-card">
              <a class="archive-spotlight-media" href="/episodes/dave-aronberg-florida-shuffle" aria-label="Watch Dave Aronberg on Fighting the Florida Shuffle">
                ${EpisodeThumbnail({
                  videoId: "XjQHRdFluZc",
                  title: "Dave Aronberg on Fighting the Florida Shuffle, Justice & Public Service",
                  thumbnail: "https://img.youtube.com/vi/XjQHRdFluZc/maxresdefault.jpg"
                })}
              </a>
              <div class="archive-spotlight-copy">
                <span class="content-label">Justice &amp; public service</span>
                <h4><a href="/episodes/dave-aronberg-florida-shuffle">Dave Aronberg: Fighting the Florida Shuffle</a></h4>
                <p>The former Palm Beach County State Attorney discusses addiction-treatment fraud, patient brokering, and accountability.</p>
                <a class="archive-spotlight-link" href="/episodes/dave-aronberg-florida-shuffle">Watch the conversation ${icon("arrow")}</a>
              </div>
            </article>

            <article class="archive-spotlight-card">
              <a class="archive-spotlight-media" href="/episodes/ric-bradshaw" aria-label="Watch Sheriff Ric Bradshaw on PBSO, Amendment 3 and Flock cameras">
                ${EpisodeThumbnail({
                  videoId: "SqRazfeMcTk",
                  title: "Sheriff Ric Bradshaw Interview: PBSO Budget, Amendment 3 & Flock Cameras",
                  thumbnail: "https://img.youtube.com/vi/SqRazfeMcTk/maxresdefault.jpg"
                })}
              </a>
              <div class="archive-spotlight-copy">
                <span class="content-label">Public safety &amp; accountability</span>
                <h4><a href="/episodes/ric-bradshaw">Sheriff Ric Bradshaw: Flock Cameras, Amendment 3 &amp; the PBSO Budget</a></h4>
                <p>The Palm Beach County sheriff discusses public-safety technology, privacy, the PBSO budget, and community trust.</p>
                <a class="archive-spotlight-link" href="/episodes/ric-bradshaw">Watch the conversation ${icon("arrow")}</a>
              </div>
            </article>
          </div>
        </section>

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
