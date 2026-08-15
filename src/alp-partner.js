import { partners } from "./data/partners.js";

const alp = partners.alp;
const partnerCard = document.querySelector("#partners .partner-card");
const disclosure = document.querySelector("#partners .affiliate-disclosure");

if (partnerCard) {
  partnerCard.className = "ecosystem-card partner-card alp-partner-card";
  partnerCard.dataset.partner = "alp";
  partnerCard.dataset.trackingStatus = alp.tracking.status;

  const live = Boolean(alp.tracking.url);
  const action = live
    ? `<div class="alp-actions">
        <a class="button button-gold alp-partner-link" href="${alp.tracking.url}" target="_blank" rel="sponsored noopener">Explore ALP</a>
        <span class="alp-offer-code">Use code <strong>${alp.offer.code}</strong> for ${alp.offer.label}</span>
      </div>`
    : `<div class="alp-actions alp-actions-pending">
        <span class="alp-status">Partner access being finalized through AvantLink.</span>
      </div>`;

  partnerCard.innerHTML = `
    <div class="alp-warning" role="note" aria-label="Nicotine warning">
      <strong>${alp.warning}</strong>
    </div>
    <div class="alp-card-body">
      <div class="ecosystem-card-mark alp-card-mark" aria-hidden="true">ALP</div>
      <div class="alp-card-copy">
        <p class="relationship-label">${alp.relationship.toUpperCase()} · ${alp.minimumAge}+</p>
        <h3>${alp.name}</h3>
        <p class="alp-deck">An adult nicotine pouch brand represented here through an approved AvantLink affiliate relationship. Commercial relationships remain separate from The Alana Show’s editorial work.</p>
        <div class="alp-offer" aria-label="Current merchant-approved affiliate offer">
          <span>MERCHANT-APPROVED AVANTLINK OFFER</span>
          <strong>${alp.offer.label}</strong>
          <small>The offer code is displayed when the website-specific partner link is activated.</small>
        </div>
        <p class="alp-disclosure"><strong>Affiliate disclosure:</strong> ${alp.disclosure}</p>
        ${action}
      </div>
    </div>
  `;
}

if (disclosure) {
  disclosure.innerHTML = `<strong>Partner standard:</strong> Selected Partners are commercial relationships, not editorial coverage. Financial relationships are identified clearly, merchant offers are used only when authorized through the applicable affiliate program, and terms may change. Adult nicotine products are for adults 21+ only.`;
}
