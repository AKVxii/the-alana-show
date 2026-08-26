import { trackEvent } from "./measurement.js";

const CAMPAIGN_GUARD = "__tasCampaignMeasurementBound";
const ALLOWED_SOURCES = new Set(["radio", "social", "guest", "email"]);
const ALLOWED_CAMPAIGNS = new Set(["george_lemieux_episode"]);

function allowlistedToken(value, allowlist) {
  const token = String(value || "").trim().toLowerCase();
  if (!token) return "";
  return allowlist.has(token) ? token : "other";
}

export function campaignAttribution(search = "") {
  const params = new URLSearchParams(String(search || ""));
  const rawSource = params.get("utm_source");
  const rawCampaign = params.get("utm_campaign");
  if (!rawSource && !rawCampaign) return null;

  return {
    source: allowlistedToken(rawSource, ALLOWED_SOURCES) || "other",
    campaign: allowlistedToken(rawCampaign, ALLOWED_CAMPAIGNS) || "other"
  };
}

export function setupCampaignMeasurement() {
  if (typeof window === "undefined" || window[CAMPAIGN_GUARD]) return;
  window[CAMPAIGN_GUARD] = true;

  const attribution = campaignAttribution(window.location.search);
  if (!attribution) return;
  trackEvent("Campaign Landing", attribution);
}
