import { partners } from "./data/partners.js";

const alp = partners.alp;
const partnerCard = document.querySelector("#partners .partner-card");

if (partnerCard) {
  partnerCard.dataset.trackingStatus = alp.tracking.status;

  const live = Boolean(alp.tracking.url);
  if (live && !partnerCard.querySelector(".alp-actions")) {
    partnerCard.querySelector(".alp-card-copy")?.insertAdjacentHTML("beforeend", `<div class="alp-actions">
        <button class="button button-gold alp-partner-link" type="button" data-affiliate-consent-open>Explore ALP</button>
        <span class="alp-offer-code">Use code <strong>${alp.offer.code}</strong> for ${alp.offer.label}</span>
      </div>`);
  }

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
        <p class="affiliate-consent-privacy"><a href="/privacy#affiliate">Read the privacy notice</a></p>
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
