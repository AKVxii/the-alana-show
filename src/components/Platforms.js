import { site } from "../data/site.js";
import { icon } from "../lib/icons.js";

export function Platforms() {
  const socials = [["Instagram", site.social.instagram], ["X", site.social.x], ["LinkedIn", site.social.linkedin]];
  return `
    <section class="worldwide-section" id="listen" aria-labelledby="worldwide-heading">
      <div class="shell">
        <div class="worldwide-heading">
          <p class="eyebrow"><span></span> From South Florida to everywhere</p>
          <h2 id="worldwide-heading">Streaming Worldwide</h2>
          <p>Watch, listen, and stay connected—wherever you are.</p>
        </div>
        <ul class="worldwide-platforms" aria-label="Watch and listen to The Alana Show">
          ${site.platforms.filter(platform => !platform.inquiry).map(platform => `
            <li><a class="worldwide-platform" href="${platform.url}" target="_blank" rel="noopener noreferrer">
              <span class="worldwide-icon">${icon(platform.icon)}</span>
              <span><strong>${platform.name}</strong><small>${platform.detail}</small></span>
              <span class="worldwide-arrow">${icon("external")}</span>
              <span class="sr-only"> (opens in a new tab)</span>
            </a></li>
          `).join("")}
        </ul>
        <div class="worldwide-socials">
          <h3>Follow the conversation</h3>
          <ul aria-label="Social media">
            ${socials.map(([name,url]) => `<li><a href="${url}" target="_blank" rel="noopener noreferrer">${name}${icon("external")}<span class="sr-only"> (opens in a new tab)</span></a></li>`).join("")}
          </ul>
        </div>
      </div>
    </section>
  `;
}
