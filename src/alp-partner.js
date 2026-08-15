import { partners } from "./data/partners.js";

if (!document.querySelector('link[data-alp-partner-styles]')) {
  const stylesheet = document.createElement("link");
  stylesheet.rel = "stylesheet";
  stylesheet.href = "/src/alp-partner.css?v=2";
  stylesheet.dataset.alpPartnerStyles = "true";
  document.head.append(stylesheet);
}

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
        <button class="button button-gold alp-partner-link" type="button" data-affiliate-consent-open>Explore ALP</button>
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

  if (live && alp.tracking.specificClickConsent) {
    const dialog = document.createElement("dialog");
    dialog.className = "affiliate-consent-dialog";
    dialog.dataset.affiliateConsent = "avantlink";
    dialog.innerHTML = `
      <form method="dialog" class="affiliate-consent-panel">
        <p class="relationship-label dark">AFFILIATE TRACKING CONSENT</p>
        <h2>Before you continue</h2>
        <p>If you choose <strong>Continue to ALP</strong>, your outbound click will use an AvantLink affiliate tracking link. AvantLink or the merchant may set a tracking cookie as a result of that click so a qualifying purchase can be attributed to The Alana Show.</p>
        <p>The Alana Show may earn a commission from a qualifying purchase at no additional cost to you. No affiliate tracking click is sent unless you choose to continue.</p>
        <p class="affiliate-consent-privacy"><a href="/privacy/#affiliate">Read the privacy notice</a></p>
        <div class="affiliate-consent-actions">
          <button class="button button-outline" value="cancel" type="submit">Cancel</button>
          <a class="button button-gold" href="${alp.tracking.url}" target="_blank" rel="sponsored noopener" data-affiliate-consent-continue>Continue to ALP</a>
        </div>
      </form>
    `;
    document.body.append(dialog);

    const openButton = partnerCard.querySelector("[data-affiliate-consent-open]");
    const continueLink = dialog.querySelector("[data-affiliate-consent-continue]");
    openButton?.addEventListener("click", () => dialog.showModal());
    continueLink?.addEventListener("click", () => dialog.close());
    dialog.addEventListener("click", event => {
      if (event.target === dialog) dialog.close();
    });
  }
}

if (disclosure) {
  disclosure.innerHTML = `<strong>Partner standard:</strong> Selected Partners are commercial relationships, not editorial coverage. Financial relationships are identified clearly, merchant offers are used only when authorized through the applicable affiliate program, and terms may change. Adult nicotine products are for adults 21+ only.`;
}
