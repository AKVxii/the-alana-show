const MEASUREMENT_GUARD = "__tasMeasurementBound";
const MAX_EVENT_PROPERTIES = 2;

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

export function trackEvent(name, data = {}) {
  const va = ensureQueue();
  if (!va || !name) return;
  va("event", { name, data: cleanData(data) });
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

  document.addEventListener("click", event => {
    const target = event.target instanceof Element ? event.target : null;
    if (!target) return;

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
