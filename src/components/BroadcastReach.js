import { site } from "../data/site.js";

const dialPositionList = () => `
  <ul class="broadcast-dial-list" aria-label="True Oldies dial positions">
    ${site.broadcast.dialPositions.map(position => `<li>${position}</li>`).join("")}
  </ul>
`;

export function BroadcastReach({ compact = false } = {}) {
  if (compact) {
    return `
      <section class="broadcast-reach broadcast-reach-compact" aria-labelledby="broadcast-reach-compact-title">
        <div class="shell broadcast-reach-compact-grid">
          <div class="broadcast-reach-heading">
            <p class="eyebrow"><span></span> Regional broadcast</p>
            <h2 id="broadcast-reach-compact-title">South Florida on air.</h2>
            <p>${site.broadcast.summary}</p>
            <a class="broadcast-reach-text-link" href="/south-florida#broadcast-reach">View verified broadcast details <span aria-hidden="true">→</span></a>
          </div>
          <div class="broadcast-compact-proof" aria-label="Current True Oldies broadcast information">
            <div>
              <span>Station</span>
              <strong>${site.broadcast.station}</strong>
            </div>
            <div>
              <span>Current schedule</span>
              <strong>${site.broadcast.schedule}</strong>
            </div>
            <a href="${site.trueOldies}" target="_blank" rel="noopener">Official station page <span aria-hidden="true">→</span></a>
          </div>
        </div>
      </section>
    `;
  }

  return `
    <section class="broadcast-reach broadcast-reach-feature" id="broadcast-reach" aria-labelledby="broadcast-reach-title">
      <div class="shell">
        <div class="broadcast-reach-heading">
          <p class="eyebrow"><span></span> Broadcast reach</p>
          <h2 id="broadcast-reach-title">On air across South Florida.</h2>
          <p>${site.broadcast.summary}</p>
        </div>

        <div class="broadcast-proof-grid">
          <article class="broadcast-station-card">
            <span class="broadcast-proof-kicker">Current broadcast</span>
            <h3>${site.broadcast.station}</h3>
            <p class="broadcast-proof-schedule">${site.broadcast.schedule}</p>
            <p>Listen through the True Oldies station network or stream online from anywhere.</p>
            <div class="broadcast-proof-actions">
              <a class="button button-gold" href="${site.trueOldiesLive}" target="_blank" rel="noopener" data-track-event="Broadcast Listen" data-track-location="broadcast-reach" data-track-exclusive="true">Listen Live</a>
              <a class="button button-ghost" href="${site.trueOldies}" target="_blank" rel="noopener">Official Station Page</a>
            </div>
          </article>

          <div class="broadcast-dial-card">
            <span class="broadcast-proof-kicker">True Oldies dial positions</span>
            <h3>Six listed signals. One South Florida show.</h3>
            ${dialPositionList()}
            <p class="broadcast-availability-note">${site.broadcast.availabilityNote}</p>
            <a class="broadcast-reach-text-link broadcast-reach-text-link-light" href="/episodes" data-track-event="Broadcast Episodes" data-track-location="broadcast-reach">Browse full conversations <span aria-hidden="true">→</span></a>
          </div>
        </div>
      </div>
    </section>
  `;
}
