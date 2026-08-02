import { icon } from "../lib/icons.js";

export function Broadcast() {
  return `
    <section class="broadcast" id="on-air">
      <div class="shell broadcast-grid">
        <div class="broadcast-mark" aria-hidden="true">
          <div class="broadcast-mic">${icon("radio")}</div>
          <div class="broadcast-rings"><i></i><i></i><i></i></div>
        </div>

        <div class="broadcast-copy">
          <div class="broadcast-status" data-broadcast-status><span></span> Tuesdays · 8:00 PM ET</div>
          <h2>Airing on True Oldies across South Florida.</h2>
          <p>
            The Alana Show is a weekly hybrid radio and streaming program heard across the True Oldies network—with worldwide online streaming and video.
          </p>
          <div class="frequency-row" aria-label="True Oldies station frequencies">
            <span>95.3 FM · Delray &amp; Boca</span>
            <span>95.9 FM · Palm Beach</span>
            <span>96.8 FM · Broward &amp; North Miami-Dade</span>
            <span>106.9 FM · Treasure Coast</span>
          </div>
        </div>

        <div class="broadcast-actions">
          <div class="true-oldies-wordmark">
            <span>True</span>
            <strong>OLDIES</strong>
            <small>South Florida</small>
          </div>
          <a class="button button-light" href="https://trueoldiesfla.com/on-air/the-alana-show" target="_blank" rel="noopener">
            Explore on True Oldies ${icon("external")}
          </a>
          <a class="broadcast-live-link" href="https://trueoldiesfla.com/" target="_blank" rel="noopener">Listen live online →</a>
        </div>
      </div>
    </section>
  `;
}
