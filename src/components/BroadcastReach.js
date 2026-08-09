import { icon } from "../lib/icons.js";
import { site } from "../data/site.js";

const frequencies = [
  ["95.3", "FM"],
  ["95.9", "FM"],
  ["96.9", "FM"],
  ["106.9", "FM"],
  ["104.7", "HD3"],
  ["104.3", "HD3"]
];

const markets = ["Miami-Dade", "Broward", "Palm Beach", "Martin", "St. Lucie"];

export function BroadcastReach() {
  return `
    <section class="section broadcast-reach" id="on-air" aria-labelledby="broadcast-reach-title">
      <div class="shell">
        <div class="broadcast-panel reveal">
          <div class="broadcast-copy">
            <p class="eyebrow"><span></span> On air across South Florida</p>
            <h2 id="broadcast-reach-title">Six signals. Five counties. One conversation.</h2>
            <p class="broadcast-lede">
              The Alana Show airs Tuesdays from 8:00–8:30 PM ET on the True Oldies Channel, reaching listeners across South Florida and the Treasure Coast — with worldwide streaming beyond the dial.
            </p>
            <div class="broadcast-actions">
              <a class="button button-gold" href="${site.trueOldies}" target="_blank" rel="noopener">View The Alana Show on True Oldies ${icon("external")}</a>
              <a class="button button-ghost" href="${site.trueOldiesLive}" target="_blank" rel="noopener">Listen live ${icon("radio")}</a>
            </div>
          </div>

          <div class="broadcast-stations" aria-label="True Oldies dial positions carrying The Alana Show">
            ${frequencies.map(([dial, band]) => `
              <div class="station-chip">
                <strong>${dial}</strong>
                <span>${band}</span>
              </div>
            `).join("")}
          </div>

          <div class="broadcast-footprint">
            <span class="broadcast-footprint-label">Broadcast footprint</span>
            <div class="market-list" aria-label="South Florida coverage areas">
              ${markets.map(market => `<span>${market}</span>`).join("")}
            </div>
            <p><strong>True Oldies Channel</strong> · South Florida radio · Worldwide streaming</p>
          </div>
        </div>
      </div>
    </section>
  `;
}
