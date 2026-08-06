import { FITZGERALD_LOGO_SRC } from "../data/fitzgerald-logo.js";

export function Sponsor() {
  return `
    <section class="sponsor-section" id="sponsor" aria-label="The Fitzgerald Group sponsor">
      <div class="sponsor-panel" data-reveal>
        <article class="sponsor-acknowledgement" aria-label="The Fitzgerald Group">
          <p class="eyebrow"><span></span> PRESENTING COMMERCIAL REAL ESTATE SPONSOR</p>
          <div class="sponsor-logo-card" data-reveal style="--reveal-delay: 90ms;">
            <img src="${FITZGERALD_LOGO_SRC}" alt="The Fitzgerald Group — Commercial Real Estate" width="663" height="147" loading="lazy">
          </div>
          <p class="sponsor-supporting">Commercial real estate strategy, representation, and opportunity.</p>
        </article>

        <aside class="sponsor-invitation" aria-labelledby="sponsor-invitation-heading" data-reveal style="--reveal-delay: 180ms;">
          <span class="sponsor-rule" aria-hidden="true"></span>
          <h3 id="sponsor-invitation-heading">Partner with The Alana Show</h3>
          <p>Exclusive category sponsorships are available to select businesses seeking a thoughtful, trusted media presence.</p>
          <a class="button button-gold" href="/#contact">Sponsorship Inquiries</a>
        </aside>
      </div>
    </section>
  `;
}
