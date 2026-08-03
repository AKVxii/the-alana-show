import { icon } from "../lib/icons.js";
import { site } from "../data/site.js";

export function Episodes() {
  return `
    <section class="section watch-section" id="watch">
      <div class="shell">
        <div class="section-heading reveal">
          <div>
            <p class="eyebrow"><span></span> Watch now</p>
            <h2>Featured Conversation</h2>
          </div>
          <p>One conversation selected to introduce the ideas, people, and perspective that define the show.</p>
        </div>

        <div class="featured-layout">
          <article class="featured-player reveal" data-featured>
            <div class="player-frame">
              <iframe
                data-featured-video
                src="https://www.youtube-nocookie.com/embed/kJWFTnWOgYM?rel=0"
                title="Featured conversation from The Alana Show"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                referrerpolicy="strict-origin-when-cross-origin"
                allowfullscreen>
              </iframe>
            </div>
            <div class="featured-meta">
              <div>
                <span class="content-label">Featured from the archive</span>
                <h3 data-featured-title>Chairman Michael Barnett Recaps the 2022 Midterms</h3>
                <p data-featured-description>A direct conversation about public life, civic engagement, grassroots leadership, and Palm Beach County.</p>
              </div>
              <div class="featured-stats" data-featured-stats></div>
            </div>
          </article>

          <aside class="watch-aside">
            <article class="latest-card reveal reveal-delay" data-latest>
              <span class="content-label">Latest conversation</span>
              <div class="latest-thumb" data-latest-thumb></div>
              <h3 data-latest-title>The newest episode</h3>
              <p data-latest-description>New conversations appear here automatically when they are published.</p>
              <a class="button button-gold full" data-latest-link href="${site.youtube}" target="_blank" rel="noopener">
                ${icon("play")} Watch latest episode
              </a>
            </article>

            <button class="discovery-card reveal" type="button" data-search-open>
              <span class="discovery-icon">${icon("search")}</span>
              <span>
                <small>Find a conversation</small>
                <strong>Search recent conversations by guest, topic, or idea.</strong>
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
          <a href="${site.youtube}" target="_blank" rel="noopener">View the full channel ${icon("arrow")}</a>
        </div>

        <div class="episode-rail" data-episode-rail aria-live="polite">
          <div class="episode-skeleton"></div>
          <div class="episode-skeleton"></div>
          <div class="episode-skeleton"></div>
        </div>
      </div>
    </section>
  `;
}
