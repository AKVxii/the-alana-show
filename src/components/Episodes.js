import { icon } from "../lib/icons.js";
import { site } from "../data/site.js";
import { escapeHtml } from "../lib/utils.js";
import { Broadcast } from "./Broadcast.js";
import { Sponsor } from "./Sponsor.js";

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
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}

export function EpisodeThumbnail(episode = {}, { latest = false } = {}) {
  const validThumbnail = isUsableThumbnailUrl(episode.thumbnail);
  const title = episode.title || "The Alana Show conversation";
  return `
    <span class="thumbnail-media${validThumbnail ? "" : " fallback-visible"}" data-thumbnail-frame>
      ${validThumbnail ? `<img${latest ? " data-latest-image" : ""} src="${escapeHtml(episode.thumbnail)}" alt="Thumbnail for ${escapeHtml(title)}" loading="lazy">` : ""}
      ${BrandedEpisodeArtwork({ compact: !latest })}
    </span>
  `;
}

export function revealThumbnailFallback(frame, image) {
  if (!frame) return;
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
        <div class="section-heading reveal">
          <div>
            <p class="eyebrow"><span></span> Watch now</p>
            <h2>Featured Conversation</h2>
          </div>
        </div>

        <div class="editorial-pair">
          <article class="featured-player reveal" data-featured>
            <div class="player-frame">
              <featured-video
                data-featured-video
                data-initial-src="https://www.youtube-nocookie.com/embed/iR4cdm9Ux3U?rel=0"
                data-title="Featured conversation from The Alana Show">
                <a href="https://www.youtube.com/watch?v=iR4cdm9Ux3U" target="_blank" rel="noopener">Watch the scam and fraud special on YouTube</a>
              </featured-video>
            </div>
            <div class="featured-meta">
              <div>
                <span class="content-label">Featured from the archive</span>
                <h3 data-featured-title>Safeguarding Yourself from Cybercrime and Fraud</h3>
                <p data-featured-description>Prosecutor Stacey Ibarra and Detective Vaughn Mitchell share practical guidance for recognizing scams, protecting personal information, and responding to cybercrime and fraud.</p>
              </div>
              <div class="featured-stats" data-featured-stats></div>
            </div>
          </article>

          ${Broadcast()}
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
                <a class="button button-gold" data-latest-link href="${site.youtube}" target="_blank" rel="noopener">
                  ${icon("play")} Watch latest episode
                </a>
              </div>
            </article>

            <button class="discovery-card reveal" type="button" data-search-open>
              <span class="discovery-icon">${icon("search")}</span>
              <span>
                <small>Find a conversation</small>
                <strong>Search the conversation archive by guest, topic, or idea.</strong>
              </span>
              ${icon("arrow")}
            </button>
          </aside>
        </div>

        <div class="episode-header reveal" id="guests">
          <div>
            <p class="eyebrow dark"><span></span> Guests &amp; ideas</p>
            <h3>Recent conversations</h3>
          </div>
          <a href="/episodes">Browse the full archive ${icon("arrow")}</a>
        </div>

        <div class="episode-rail" data-episode-rail aria-live="polite">
          <div class="episode-skeleton"></div>
          <div class="episode-skeleton"></div>
          <div class="episode-skeleton"></div>
        </div>

        ${Sponsor()}
      </div>
    </section>
  `;
}
