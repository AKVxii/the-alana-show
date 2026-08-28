import { icon } from "../lib/icons.js";

const ALANA_PORTRAIT_WEBP = "/assets/alana-portrait-host-v4.webp";
const ALANA_PORTRAIT_PNG = "/assets/alana-portrait-host-v4.png";
const ALANA_PORTRAIT_WIDTH = 958;
const ALANA_PORTRAIT_HEIGHT = 968;

export function Hero() {
  return `
    <section class="hero" id="home">
      <div class="shell hero-grid">
        <div class="hero-copy reveal">
          <p class="eyebrow"><span></span> Voice of the Gold Coast</p>
          <h1>
            <span class="title-small">Alana</span>
            <span class="title-main">All Over</span>
            <span class="title-show">the Place</span>
          </h1>
          <p class="hero-line">Real conversations. <em>Distinct voices.</em> Thoughtful perspective.</p>
          <p class="hero-intro">
            In-depth interviews with people shaping business, public service, culture, and community—grounded in South Florida and available wherever you watch or listen.
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
          <div class="portrait-frame">
            <div class="portrait-inner">
              <div class="portrait-motion" aria-hidden="true">
                <span class="portrait-motion-ring portrait-motion-ring-one"></span>
                <span class="portrait-motion-ring portrait-motion-ring-two"></span>
                <span class="portrait-motion-beam"></span>
                <span class="portrait-motion-glint"></span>
              </div>
              <picture style="display:contents">
                <source srcset="${ALANA_PORTRAIT_WEBP}" type="image/webp">
                <img src="${ALANA_PORTRAIT_PNG}" alt="Alana K. Vandeveer, host of Alana — All Over the Place" width="${ALANA_PORTRAIT_WIDTH}" height="${ALANA_PORTRAIT_HEIGHT}" fetchpriority="high" decoding="async">
              </picture>
            </div>
          </div>
          <div class="portrait-caption">
            <span class="sr-only">Hosted by</span>
            <span>HOST, ALANA — ALL OVER THE PLACE</span>
            <strong>Alana K. Vandeveer</strong>
          </div>
        </div>
      </div>
    </section>
  `;
}
