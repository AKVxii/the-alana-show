import { icon } from "../lib/icons.js";
import { Newsletter } from "../newsletter.js";

export function Partner() {
  return `
    <section class="section partner-section" id="partner">
      <div class="shell">
        <div class="partner-panel reveal">
          <div class="partner-copy">
            <p class="eyebrow"><span></span> Advertise &amp; partner</p>
            <h2>Partner with conversations that matter.</h2>
            <p>
              Connect your organization with thoughtful conversations centered on leadership, business, public life, service, community, culture, and purpose — with South Florida terrestrial radio reach and worldwide digital streaming.
            </p>
            <div class="partner-actions">
              <a class="button button-gold" href="#contact" data-inquiry="Advertising or partnership">Request partnership information ${icon("arrow")}</a>
              <a class="button button-ghost" href="#contact" data-inquiry="Media inquiry">Request a media kit</a>
              <a class="button button-ghost" href="/on-location">Bring the show to you</a>
            </div>
          </div>

          <div class="partner-menu">
            <article><span>01</span><strong>Episode Sponsorship</strong><small>Refined opening, closing, or on-screen acknowledgment.</small></article>
            <article><span>02</span><strong>Season Partnership</strong><small>A consistent presence across a curated series.</small></article>
            <article><span>03</span><strong>Community Impact</strong><small>Underwrite service-focused storytelling and reach.</small></article>
            <article><span>04</span><strong>On Location</strong><small>Invite The Alana Show to a business, event, community setting, or public-affairs conversation.</small></article>
          </div>
        </div>
        <p class="editorial-independence">Advertising support never purchases guest appearances, controls questions, or determines editorial positions.</p>
      </div>
    </section>
    ${Newsletter()}
  `;
}
