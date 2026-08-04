import { icon } from "../lib/icons.js";
import { site } from "../data/site.js";

export function Broadcast() {
  return `
    <aside class="broadcast reveal" id="on-air" aria-labelledby="broadcast-heading">
      <div class="broadcast-grid">
        <div class="broadcast-mark" aria-hidden="true">
          <div class="broadcast-mic">${icon("radio")}</div>
          <div class="broadcast-rings"><i></i><i></i><i></i></div>
        </div>

        <div class="broadcast-copy">
          <div class="broadcast-status" data-broadcast-status><span></span> Tuesdays · 8:00 PM ET</div>
          <h2 id="broadcast-heading">Airing on True Oldies across South Florida.</h2>
          <p>
            The Alana Show airs on True Oldies in South Florida, with worldwide online streaming and video access.
          </p>
          <div class="broadcast-facts" aria-label="Broadcast availability">
            <span>South Florida broadcast</span>
            <span>Worldwide streaming</span>
          </div>
        </div>

        <div class="broadcast-actions">
          <div class="true-oldies-wordmark">
            <span>True</span>
            <strong>OLDIES</strong>
            <small>South Florida</small>
          </div>
          <a class="button button-light" href="${site.trueOldies}" target="_blank" rel="noopener">
            Explore on True Oldies ${icon("external")}
          </a>
        </div>
      </div>
    </aside>
  `;
}
