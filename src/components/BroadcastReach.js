import { site } from "../data/site.js";

const BROADCAST_PICTURE = ({ className = "", alt = "" } = {}) => `
  <picture style="display:contents">
    <source srcset="/assets/broadcast-reach-south-florida-v2.webp" type="image/webp">
    <img
      ${className ? `class="${className}"` : ""}
      src="/assets/broadcast-reach-south-florida.png"
      width="1672"
      height="941"
      loading="lazy"
      decoding="async"
      alt="${alt}"
    >
  </picture>
`;

export function BroadcastReach({ compact = false } = {}) {
  if (compact) {
    return `
      <section class="broadcast-reach broadcast-reach-compact" aria-labelledby="broadcast-reach-compact-title">
        <div class="shell broadcast-reach-compact-grid">
          <div class="broadcast-reach-heading">
            <p class="eyebrow"><span></span> Regional broadcast</p>
            <h2 id="broadcast-reach-compact-title">South Florida on air.</h2>
            <p>${site.broadcastSchedule} on True Oldies, with worldwide streaming available.</p>
            <a class="broadcast-reach-text-link" href="/south-florida/#broadcast-reach">View the full broadcast reach <span aria-hidden="true">→</span></a>
          </div>
          <a class="broadcast-artwork-preview" href="/south-florida/#broadcast-reach" aria-label="View The Alana Show full South Florida broadcast reach">
            ${BROADCAST_PICTURE({ alt: "The Alana Show broadcast reach across South Florida and the Treasure Coast." })}
          </a>
        </div>
      </section>
    `;
  }

  return `
    <section class="broadcast-reach broadcast-reach-feature" id="broadcast-reach" aria-labelledby="broadcast-reach-title">
      <div class="shell">
        <div class="broadcast-reach-heading">
          <p class="eyebrow"><span></span> Broadcast reach</p>
          <h2 id="broadcast-reach-title">On Air Across South Florida</h2>
          <p>Heard ${site.broadcastSchedule} on True Oldies across South Florida and the Treasure Coast, with worldwide streaming available.</p>
        </div>

        <div class="broadcast-artwork-frame">
          ${BROADCAST_PICTURE({
            className: "broadcast-artwork",
            alt: "The Alana Show broadcast reach across South Florida, airing Tuesdays 8:00 PM to 9:00 PM Eastern on the True Oldies Channel, with six dial positions, South Florida county coverage, and worldwide streaming."
          })}
          <a class="broadcast-hotspot broadcast-hotspot-listen" href="${site.trueOldiesLive}" target="_blank" rel="noopener" aria-label="Listen live on True Oldies" data-track-event="Broadcast Listen" data-track-location="broadcast-reach" data-track-exclusive="true"><span class="sr-only">Listen Live</span></a>
          <a class="broadcast-hotspot broadcast-hotspot-episodes" href="/episodes/" aria-label="View The Alana Show episodes" data-track-event="Broadcast Episodes" data-track-location="broadcast-reach" data-track-exclusive="true"><span class="sr-only">View Episodes</span></a>
        </div>

        <div class="broadcast-mobile-actions" aria-label="Broadcast actions">
          <a class="button button-gold" href="${site.trueOldiesLive}" target="_blank" rel="noopener" data-track-event="Broadcast Listen" data-track-location="broadcast-reach-mobile" data-track-exclusive="true">Listen Live</a>
          <a class="button button-ghost" href="/episodes/" data-track-event="Broadcast Episodes" data-track-location="broadcast-reach-mobile" data-track-exclusive="true">View Episodes</a>
        </div>
      </div>
    </section>
  `;
}
