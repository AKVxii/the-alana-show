import { site } from "../data/site.js";
import { icon } from "../lib/icons.js";

export function Platforms() {
  return `
    <section class="section listen-section" id="listen">
      <div class="shell">
        <div class="platform-heading reveal">
          <span aria-hidden="true"></span>
          <h2>
            <span class="platform-heading-wide">Watch or listen wherever you are</span>
            <span class="platform-heading-mobile">Listen everywhere</span>
          </h2>
          <span aria-hidden="true"></span>
        </div>

        <div class="platform-rail" role="list">
          ${site.platforms.map(platform => `
            <a class="platform-card reveal" role="listitem" href="${platform.url}" aria-label="${platform.name}: ${platform.detail}"${platform.inquiry ? ` data-inquiry="${platform.inquiry}"` : ""}${platform.url.startsWith("http") ? ' target="_blank" rel="noopener"' : ""}>
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
