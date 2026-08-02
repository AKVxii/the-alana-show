import { site } from "../data/site.js";
import { icon } from "../lib/icons.js";

export function Impact() {
  return `
    <section class="section impact-section" id="impact">
      <div class="shell impact-grid">
        <div class="impact-intro reveal">
          <div class="impact-emblem" aria-hidden="true">
            <span>Stepping</span>
            <strong>UP</strong>
          </div>
          <p class="eyebrow"><span></span> A community impact series</p>
          <h2>Honoring people who step forward.</h2>
          <p>
            A signature series highlighting veterans, first responders, advocates, nonprofit organizations, faith-based initiatives, public servants, and neighbors doing meaningful work.
          </p>
          <a class="button button-gold" href="#contact" data-inquiry="Recommend an organization">Recommend an organization ${icon("arrow")}</a>
        </div>

        <div class="organization-grid">
          ${site.organizations.map((organization, index) => `
            <article class="organization-card reveal" style="--delay:${index * 80}ms">
              <span>${organization.category}</span>
              <h3>${organization.name}</h3>
              <p>${organization.description}</p>
              <a href="${organization.url}" target="_blank" rel="noopener">Visit organization ${icon("external")}</a>
            </article>
          `).join("")}
          <article class="organization-card organization-callout reveal">
            <span>Featured with purpose</span>
            <h3>A conversation can continue long after the episode ends.</h3>
            <p>Selected community and nonprofit guests are featured without an appearance fee. Editorial judgment remains independent.</p>
          </article>
        </div>
      </div>
    </section>
  `;
}
