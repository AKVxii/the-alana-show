const MEASUREMENT_GUARD = "__tasMeasurementBound";
const MAX_EVENT_PROPERTIES = 2;
const ANALYTICS_CONSENT_KEY = "tas:analytics-consent:v1";
const GOOGLE_CONFIG_ENDPOINT = "/api/measurement-config";
let googleMeasurementPromise = null;

function ensureQueue() {
  if (typeof window === "undefined") return null;
  if (typeof window.va !== "function") {
    window.va = function (...args) {
      (window.vaq = window.vaq || []).push(args);
    };
  }
  return window.va;
}

function cleanData(data = {}) {
  return Object.fromEntries(
    Object.entries(data)
      .filter(([, value]) => value !== undefined && value !== null && value !== "")
      .slice(0, MAX_EVENT_PROPERTIES)
      .map(([key, value]) => [key, typeof value === "string" ? value.slice(0, 120) : value])
  );
}

function googleEventName(name = "") {
  return String(name)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 40) || "site_event";
}

function readAnalyticsConsent() {
  try {
    const value = localStorage.getItem(ANALYTICS_CONSENT_KEY);
    return value === "granted" || value === "denied" ? value : "";
  } catch {
    return "";
  }
}

function writeAnalyticsConsent(value) {
  try {
    localStorage.setItem(ANALYTICS_CONSENT_KEY, value);
  } catch {
    // Consent storage is a convenience only; a blocked store must not break the site.
  }
}

function clearAnalyticsConsent() {
  try {
    localStorage.removeItem(ANALYTICS_CONSENT_KEY);
  } catch {
    // If storage is blocked there is nothing to clear.
  }
}

function removeConsentPrompt() {
  document.querySelector("[data-analytics-consent]")?.remove();
}

function ensureConsentStyles() {
  if (document.querySelector('link[data-analytics-consent-style]')) return;
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = "/src/analytics-consent.css?v=1";
  link.dataset.analyticsConsentStyle = "true";
  document.head.append(link);
}

function showConsentPrompt(onGrant) {
  if (typeof document === "undefined" || document.querySelector("[data-analytics-consent]")) return;
  ensureConsentStyles();
  const aside = document.createElement("aside");
  aside.className = "analytics-consent";
  aside.dataset.analyticsConsent = "true";
  aside.setAttribute("role", "dialog");
  aside.setAttribute("aria-label", "Analytics preference");
  aside.innerHTML = `
    <div>
      <strong>Help improve The Alana Show?</strong>
      <p>Allow optional Google Analytics measurement. We do not send names, email addresses, phone numbers, messages, or raw search text. <a href="/privacy/">Privacy</a></p>
    </div>
    <div class="analytics-consent-actions">
      <button type="button" class="button button-gold button-small" data-analytics-allow>Allow analytics</button>
      <button type="button" class="analytics-consent-decline" data-analytics-decline>No thanks</button>
    </div>`;
  document.body.append(aside);

  aside.querySelector("[data-analytics-allow]")?.addEventListener("click", () => {
    writeAnalyticsConsent("granted");
    removeConsentPrompt();
    onGrant();
  });
  aside.querySelector("[data-analytics-decline]")?.addEventListener("click", () => {
    writeAnalyticsConsent("denied");
    removeConsentPrompt();
  });
}

function installGoogleTag(measurementId) {
  if (!measurementId || typeof window === "undefined") return;
  if (window.__tasGoogleAnalyticsId === measurementId && typeof window.gtag === "function") return;

  window.__tasGoogleAnalyticsId = measurementId;
  window.dataLayer = window.dataLayer || [];
  window.gtag = window.gtag || function (...args) {
    window.dataLayer.push(args);
  };
  window.gtag("js", new Date());
  window.gtag("config", measurementId, {
    send_page_view: true,
    allow_google_signals: false,
    allow_ad_personalization_signals: false
  });

  if (!document.querySelector(`script[data-google-analytics="${measurementId}"]`)) {
    const script = document.createElement("script");
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(measurementId)}`;
    script.dataset.googleAnalytics = measurementId;
    document.head.append(script);
  }
}

async function setupGoogleMeasurement() {
  if (typeof window === "undefined") return;
  if (googleMeasurementPromise) return googleMeasurementPromise;

  googleMeasurementPromise = fetch(GOOGLE_CONFIG_ENDPOINT, { headers: { Accept: "application/json" } })
    .then(async response => {
      if (!response.ok) return "";
      const payload = await response.json();
      return payload?.googleAnalyticsEnabled ? String(payload.gaMeasurementId || "").trim() : "";
    })
    .then(measurementId => {
      if (!measurementId) return;
      const consent = readAnalyticsConsent();
      if (consent === "granted") {
        installGoogleTag(measurementId);
        return;
      }
      if (consent !== "denied") showConsentPrompt(() => installGoogleTag(measurementId));
    })
    .catch(() => {
      // Optional measurement must never affect the visitor experience.
    });

  return googleMeasurementPromise;
}

export function trackEvent(name, data = {}) {
  if (!name) return;
  const cleaned = cleanData(data);
  const va = ensureQueue();
  if (va) va("event", { name, data: cleaned });
  if (typeof window !== "undefined" && typeof window.gtag === "function") {
    window.gtag("event", googleEventName(name), cleaned);
  }
}

export function lengthBucket(value = "") {
  const length = String(value).trim().length;
  if (!length) return "0";
  if (length <= 3) return "1-3";
  if (length <= 8) return "4-8";
  if (length <= 20) return "9-20";
  return "21+";
}

function slugAfter(pathname, prefix) {
  const value = pathname.slice(prefix.length).replace(/^\/+|\/+$/g, "");
  return value || undefined;
}

function platformFor(url) {
  const host = url.hostname.replace(/^www\./, "").toLowerCase();
  if (host.includes("youtube.com") || host === "youtu.be") return "youtube";
  if (host.includes("spotify.com")) return "spotify";
  if (host.includes("podcasts.apple.com")) return "apple-podcasts";
  if (host.includes("music.amazon.")) return "amazon-music";
  if (host.includes("iheart.com")) return "iheartradio";
  if (host.includes("trueoldiesfla.com")) return "true-oldies";
  return host || "external";
}

function classifyAnchor(anchor) {
  const rawHref = anchor.getAttribute("href") || "";
  if (!rawHref || rawHref.startsWith("javascript:")) return null;

  if (rawHref.startsWith("mailto:")) {
    return ["Email Intent", { page: location.pathname }];
  }

  let url;
  try {
    url = new URL(anchor.href, location.href);
  } catch {
    return null;
  }

  if (url.origin !== location.origin) {
    const platform = platformFor(url);
    if (platform === "youtube") return ["Watch Outbound", { platform, page: location.pathname }];
    if (["spotify", "apple-podcasts", "amazon-music", "iheartradio"].includes(platform)) {
      return ["Listen Outbound", { platform, page: location.pathname }];
    }
    if (platform === "true-oldies") return ["On Air Outbound", { platform, page: location.pathname }];
    return ["External Outbound", { platform, page: location.pathname }];
  }

  const path = url.pathname.replace(/\/+$/, "") || "/";
  if (path.startsWith("/episodes/")) return ["Episode Open", { episode: slugAfter(path, "/episodes/") }];
  if (path.startsWith("/guests/")) return ["Guest Open", { guest: slugAfter(path, "/guests/") }];
  if (path.startsWith("/topics/")) return ["Topic Open", { topic: slugAfter(path, "/topics/") }];
  if (path === "/advertise") return ["Partnership Explore", { page: location.pathname }];
  if (path === "/book") return ["Guest Inquiry Explore", { page: location.pathname }];
  if (url.hash === "#contact") return ["Contact Intent", { page: location.pathname }];
  return null;
}

function customEventFor(element) {
  const name = element?.dataset?.trackEvent;
  if (!name) return null;
  return [name, {
    location: element.dataset.trackLocation,
    label: element.dataset.trackLabel
  }];
}

export function setupMeasurement() {
  if (typeof window === "undefined" || window[MEASUREMENT_GUARD]) return;
  window[MEASUREMENT_GUARD] = true;
  ensureQueue();
  setupGoogleMeasurement();

  document.addEventListener("click", event => {
    const target = event.target instanceof Element ? event.target : null;
    if (!target) return;

    if (target.closest("[data-reset-analytics-consent]")) {
      clearAnalyticsConsent();
      location.reload();
      return;
    }

    const customTarget = target.closest("[data-track-event]");
    const custom = customEventFor(customTarget);
    if (custom) {
      trackEvent(custom[0], custom[1]);
      if (customTarget.dataset.trackExclusive === "true") return;
    }

    if (target.closest("[data-search-open]")) {
      trackEvent("Search Open", { page: location.pathname });
      return;
    }

    const inquiry = target.closest("[data-inquiry]");
    if (inquiry) {
      trackEvent("Inquiry Intent", { inquiry: inquiry.dataset.inquiry, page: location.pathname });
    }

    const anchor = target.closest("a[href]");
    if (!anchor) return;
    const classified = classifyAnchor(anchor);
    if (classified) trackEvent(classified[0], classified[1]);
  }, { capture: true });

  document.addEventListener("submit", event => {
    const form = event.target instanceof HTMLFormElement ? event.target : null;
    if (!form?.matches("[data-contact-form]")) return;
    const inquiry = form.elements.namedItem("inquiry");
    trackEvent("Contact Form Attempt", {
      inquiry: inquiry instanceof HTMLSelectElement ? inquiry.value : undefined,
      page: location.pathname
    });
  }, { capture: true });
}
