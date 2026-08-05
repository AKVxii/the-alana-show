export function Sponsor() {
  return `
    <section class="sponsor-section" id="sponsor" aria-labelledby="sponsor-heading">
      <div class="sponsor-panel">
        <article class="sponsor-acknowledgement" aria-labelledby="sponsor-heading">
          <p class="eyebrow"><span></span> PRESENTING COMMERCIAL REAL ESTATE SPONSOR</p>
          <div class="sponsor-logo-card">
            <img src="/assets/fitzgerald-group-logo.svg" alt="The Fitzgerald Group" width="663" height="147" loading="lazy">
          </div>
          <div class="sponsor-copy">
            <h2 id="sponsor-heading">The Fitzgerald Group</h2>
            <p>For commercial real estate strategy, representation, and opportunity.</p>
          </div>
        </article>

        <aside class="sponsor-invitation" aria-labelledby="sponsor-invitation-heading">
          <span class="sponsor-rule" aria-hidden="true"></span>
          <h3 id="sponsor-invitation-heading">Sponsor The Alana Show</h3>
          <p>Category sponsorships are offered on a first-confirmed basis, with one featured sponsor per business category.</p>
          <a class="button button-gold" href="/#contact">Sponsorship Inquiries</a>
        </aside>
      </div>
    </section>
  `;
}
