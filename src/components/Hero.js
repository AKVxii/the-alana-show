import { icon } from "../lib/icons.js";

export function Hero() {
  return `
    <section class="hero" id="home">
      <div class="hero-aurora" aria-hidden="true"></div>
      <div class="signal-field" aria-hidden="true">
        <span></span><span></span><span></span><span></span><span></span>
      </div>

      <div class="shell hero-grid">
        <div class="hero-copy reveal">
          <p class="eyebrow"><span></span> Voice of the Gold Coast</p>
          <h1>
            <span class="title-small">The</span>
            <span class="title-main">Alana</span>
            <span class="title-show">Show</span>
          </h1>
          <p class="hero-line">Real conversations. <em>Distinct voices.</em> Thoughtful perspective.</p>
          <p class="hero-intro">
            A curated introduction to the people, ideas, and stories at the heart of The Alana Show.
          </p>

          <div class="hero-actions">
            <a class="button button-gold" href="#watch">${icon("play")} Watch featured conversation</a>
            <a class="button button-ghost" href="#listen">Listen everywhere ${icon("arrow")}</a>
          </div>

          <div class="hero-credentials" aria-label="Show details">
            <span>South Florida radio</span>
            <span>Worldwide streaming</span>
            <span>Independent editorial voice</span>
          </div>
        </div>

        <div class="portrait-stage reveal reveal-delay">
          <div class="portrait-orbit" aria-hidden="true"></div>
          <div class="portrait-frame">
            <div class="portrait-inner">
              <img src="/assets/alana-portrait.webp" alt="Alana K. Vandeveer, host of The Alana Show" width="1200" height="1500" fetchpriority="high">
            </div>
          </div>
          <div class="portrait-caption">
            <span>HOSTED BY</span>
            <strong>Alana K. Vandeveer</strong>
          </div>
        </div>
      </div>

    </section>
  `;
}
