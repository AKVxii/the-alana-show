import { currentSpecial } from "../data/current-special.js";
import { escapeHtml } from "../lib/utils.js";
import { icon } from "../lib/icons.js";

const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;

function utcDateKey(now) {
  const date = now instanceof Date ? now : new Date(now);
  if (Number.isNaN(date.valueOf())) return null;
  return [date.getUTCFullYear(), String(date.getUTCMonth() + 1).padStart(2, "0"), String(date.getUTCDate()).padStart(2, "0")].join("-");
}

export function isCurrentSpecialActive(config = currentSpecial, now = new Date()) {
  if (!config?.enabled) return false;
  const today = utcDateKey(now);
  if (!today) return false;
  if (config.startDate != null && (!DATE_ONLY.test(config.startDate) || today < config.startDate)) return false;
  if (config.endDate != null && (!DATE_ONLY.test(config.endDate) || today > config.endDate)) return false;
  return true;
}

export function CurrentSpecial(config = currentSpecial, now = new Date()) {
  if (!isCurrentSpecialActive(config, now)) return "";
  const theme = ["gold", "current-special"].includes(config.theme) ? config.theme : "current-special";
  const broadcastDetails = config.broadcastText || config.reachText
    ? `<div class="current-special-broadcast" aria-label="True Oldies broadcast reach">
        ${config.broadcastText ? `<p class="current-special-stations">${escapeHtml(config.broadcastText)}</p>` : ""}
        ${config.reachText ? `<p class="current-special-reach">${escapeHtml(config.reachText)}</p>` : ""}
      </div>`
    : "";
  const externalCta = config.ctaExternal === true || /^https?:\/\//i.test(config.ctaHref || "");
  const ctaAttributes = externalCta
    ? ` target="_blank" rel="noopener noreferrer"`
    : ` data-inquiry="Candidate Interview Series"`;

  return `
    <section class="current-special current-special--${theme}" aria-labelledby="current-special-heading" data-current-special>
      <div class="shell">
        <div class="current-special-panel">
          <div class="current-special-accent" aria-hidden="true">Alana — All Over the Place</div>
          <div class="current-special-copy">
            <p class="eyebrow"><span></span> ${escapeHtml(config.eyebrow)}</p>
            <p class="current-special-availability">Limited Availability</p>
            <h2 id="current-special-heading">${escapeHtml(config.heading)}</h2>
            <p class="current-special-lede">${escapeHtml(config.copy)}</p>
            ${broadcastDetails}
            <p class="current-special-urgency"><strong>${escapeHtml(config.urgencyText)}</strong></p>
            <a class="button button-gold current-special-cta" href="${escapeHtml(config.ctaHref)}"${ctaAttributes}>${escapeHtml(config.ctaLabel)} ${icon("arrow")}</a>
            <p class="current-special-disclaimer">${escapeHtml(config.disclaimer)}</p>
          </div>
        </div>
      </div>
    </section>`;
}
