import { site } from "../data/site.js";

export function BroadcastReach() {
  return `
    <section class="section broadcast-reach" id="on-air" aria-labelledby="broadcast-reach-title">
      <div class="shell">
        <h2 class="sr-only" id="broadcast-reach-title">The Alana Show broadcast reach across South Florida</h2>
        <p class="sr-only">
          The Alana Show airs Tuesdays from 8:00 PM to 9:00 PM Eastern on the True Oldies Channel, with terrestrial radio reach across South Florida and the Treasure Coast plus worldwide streaming.
        </p>

        <div class="broadcast-artwork-frame reveal">
          <img
            class="broadcast-artwork"
            src="/assets/broadcast-reach-south-florida.png"
            width="1672"
            height="941"
            loading="eager"
            fetchpriority="high"
            decoding="async"
            alt="The Alana Show broadcast reach across South Florida, airing Tuesdays 8:00 PM to 9:00 PM Eastern on the True Oldies Channel, with six dial positions, South Florida county coverage, and worldwide streaming."
          >
          <a class="broadcast-hotspot broadcast-hotspot-listen" href="${site.trueOldiesLive}" target="_blank" rel="noopener" aria-label="Listen live to the True Oldies Channel"><span class="sr-only">Listen Live</span></a>
          <a class="broadcast-hotspot broadcast-hotspot-episodes" href="/episodes" aria-label="View The Alana Show episodes"><span class="sr-only">View Episodes</span></a>
        </div>

        <div class="broadcast-mobile-actions" aria-label="Broadcast actions">
          <a class="button button-gold" href="${site.trueOldiesLive}" target="_blank" rel="noopener">Listen Live</a>
          <a class="button button-ghost" href="/episodes">View Episodes</a>
        </div>
      </div>
    </section>
  `;
}
