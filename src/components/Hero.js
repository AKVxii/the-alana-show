import { icon } from "../lib/icons.js";

const ALANA_PORTRAIT_WEBP = "/assets/alana-portrait-host-v4.webp";
const ALANA_PORTRAIT_PNG = "/assets/alana-portrait-host-v4.png";
const ALANA_PORTRAIT_WIDTH = 958;
const ALANA_PORTRAIT_HEIGHT = 968;

export function Hero() {
  return `
    <section class="hero coastal-home-hero" id="home">
      <div class="shell coastal-masthead-wrap">
        <div class="coastal-masthead" aria-label="The Alana Show — Real Conversations. Distinct Voices.">
          <span class="coastal-masthead-frame" aria-hidden="true"></span>
          <span class="coastal-sun" aria-hidden="true"></span>
          <span class="coastal-skyline" aria-hidden="true"></span>
          <span class="coastal-globe" aria-hidden="true"></span>
          <div class="coastal-masthead-copy">
            <h1>THE ALANA SHOW</h1>
            <p>REAL CONVERSATIONS. DISTINCT VOICES.</p>
          </div>
          <span class="coastal-microphone" aria-hidden="true"><i></i><b></b></span>
        </div>
      </div>

      <div class="shell coastal-intro-grid">
        <div class="coastal-intro-copy reveal">
          <p class="eyebrow"><span></span> Alana K. Vandeveer</p>
          <h2>All over the <em>map</em> so you don’t have to be.</h2>
          <p class="hero-intro">
            Conversations with people worth knowing — on air, online, and everywhere you listen.
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
                <img src="${ALANA_PORTRAIT_PNG}" alt="Alana K. Vandeveer, host of The Alana Show" width="${ALANA_PORTRAIT_WIDTH}" height="${ALANA_PORTRAIT_HEIGHT}" fetchpriority="high" decoding="async">
              </picture>
            </div>
          </div>
          <div class="portrait-caption">
            <span class="sr-only">Hosted by</span>
            <span>HOST, THE ALANA SHOW</span>
            <strong>Alana K. Vandeveer</strong>
          </div>
        </div>
      </div>
    </section>
  `;
}
