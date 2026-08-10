import { icon } from "../lib/icons.js";

export function Merchandise() {
  return `
    <section class="section merchandise-teaser" aria-labelledby="merchandise-teaser-title">
      <div class="shell merchandise-teaser-grid">
        <div class="merchandise-teaser-copy reveal">
          <p class="eyebrow dark"><span></span> Merchandise</p>
          <h2 id="merchandise-teaser-title">Wear the message.</h2>
          <p>Limited organic-cotton tees and a natural show hat inspired by The Alana Show, available individually by request.</p>
          <div class="merchandise-teaser-actions">
            <a class="button button-gold" href="/merchandise/" data-track-event="Merchandise Explore" data-track-location="home">View merchandise ${icon("arrow")}</a>
          </div>
          <small>Made to order · Availability, timing, shipping, and payment confirmed personally before purchase.</small>
        </div>
        <a class="merchandise-teaser-art reveal" href="/merchandise/" aria-label="View The Alana Show merchandise collection" data-track-event="Merchandise Explore" data-track-location="home-image">
          <img src="/assets/alana-show-merchandise-collection.png" width="1600" height="1200" loading="lazy" alt="The Alana Show merchandise collection featuring four light organic-cotton quote tees and a Save it for the show hat">
        </a>
      </div>
    </section>
  `;
}
