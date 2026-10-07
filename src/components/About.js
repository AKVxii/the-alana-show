import { icon } from "../lib/icons.js";

const ALANA_PORTRAIT_WEBP = "/assets/alana-standing-arms-crossed-crop.webp";
const ALANA_PORTRAIT_PNG = "/assets/alana-standing-arms-crossed-crop.png";
const ALANA_PORTRAIT_WIDTH = 500;
const ALANA_PORTRAIT_HEIGHT = 581;

export function About() {
  return `
    <section class="section about-section" id="about">
      <div class="shell about-grid">
        <div class="about-portrait reveal">
          <div class="about-photo-frame">
            <picture class="about-photo"><source srcset="${ALANA_PORTRAIT_WEBP}" type="image/webp"><img src="${ALANA_PORTRAIT_PNG}" alt="Alana K. Vandeveer, host of The Alana Show, standing with her arms crossed" width="${ALANA_PORTRAIT_WIDTH}" height="${ALANA_PORTRAIT_HEIGHT}" loading="lazy" decoding="async"></picture>
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
          <div class="hero-actions"><a class="button button-outline" href="/about/">Full host profile ${icon("arrow")}</a></div>
        </div>
      </div>
    </section>
  `;
}
