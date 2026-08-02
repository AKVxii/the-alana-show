import { site } from "../data/site.js";
import { icon } from "../lib/icons.js";

export function Platforms() {
  return `
    <section class="section listen-section" id="listen">
      <div class="shell">
        <div class="section-heading compact reveal">
          <div>
            <p class="eyebrow dark"><span></span> Watch. Listen. Join the conversation.</p>
            <h2>The Alana Show meets you wherever you listen.</h2>
          </div>
          <p>Watch full conversations, choose your favorite podcast app, or tune in on air across South Florida.</p>
        </div>

        <div class="platform-rail" role="list">
          ${site.platforms.map(platform => `
            <a class="platform-card reveal" role="listitem" href="${platform.url}" target="_blank" rel="noopener">
              <span class="platform-icon">${icon(platform.icon)}</span>
              <span class="platform-copy">
                <strong>${platform.name}</strong>
                <small>${platform.detail}</small>
              </span>
              <span class="platform-arrow">${icon("arrow")}</span>
            </a>
          `).join("")}
        </div>
      </div>
    </section>
  `;
}
