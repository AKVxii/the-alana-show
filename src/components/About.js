import { icon } from "../lib/icons.js";
import { ALANA_PORTRAIT_HEIGHT, ALANA_PORTRAIT_SRC, ALANA_PORTRAIT_WIDTH } from "../lib/alanaPortrait.js";

export function About() {
  return `
    <section class="section about-section" id="about">
      <div class="shell about-grid">
        <div class="about-portrait reveal">
          <div class="about-photo-frame">
            <img src="${ALANA_PORTRAIT_SRC}" alt="Alana K. Vandeveer in the studio" width="${ALANA_PORTRAIT_WIDTH}" height="${ALANA_PORTRAIT_HEIGHT}" loading="lazy">
          </div>
          <div class="about-monogram" aria-hidden="true">AKV</div>
        </div>

        <div class="about-copy reveal reveal-delay">
          <p class="eyebrow dark"><span></span> Meet the host</p>
          <h2>Curious, direct, prepared—and always listening.</h2>
          <p class="about-lede">
            Alana K. Vandeveer is an entrepreneur, commercial real estate professional, community advocate, and media host with a deep interest in people, public life, faith, service, and the ideas shaping our communities.
          </p>
          <p>
            Raised in a civically engaged Minnesota family and now based in South Florida, Alana brings warmth, practical judgment, preparation, and genuine curiosity to conversations with leaders, experts, entrepreneurs, advocates, artists, athletes, public servants, and compelling everyday people.
          </p>

          <blockquote class="host-principle">
            <span class="quote-icon">${icon("quote")}</span>
            <p>“If someone isn’t in the room, don’t talk about them.”</p>
            <footer>A principle behind every conversation</footer>
          </blockquote>

          <div class="host-signature">Alana K. Vandeveer</div>
        </div>
      </div>
    </section>
  `;
}
