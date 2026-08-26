const NAVIGATION_WARMUP_GUARD = "__tasNavigationWarmupBound";
const warmedDocuments = new Set();
const warmedModules = new Set();

const routeModules = new Map([
  ["/", "/src/home-entry.js"],
  ["/episodes", "/src/episodes-page.js"],
  ["/guests", "/src/guests-page.js"],
  ["/topics", "/src/topics-page.js"],
  ["/candidates", "/src/candidates-page.js?v=20260820-payment-booking"],
  ["/south-florida", "/src/growth-page.js"],
  ["/about", "/src/about-page.js"],
  ["/merchandise", "/src/merchandise-page.js"],
  ["/beyond-the-show", "/src/beyond-show-page.js"]
]);

function normalizedPath(pathname) {
  return pathname === "/" ? "/" : pathname.replace(/\/+$/, "");
}

function connectionAllowsWarmup() {
  const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
  if (connection?.saveData) return false;
  return !["slow-2g", "2g"].includes(connection?.effectiveType);
}

function connectionAllowsBroadWarmup() {
  const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
  return connectionAllowsWarmup() && (!connection?.effectiveType || connection.effectiveType === "4g");
}

function internalDocumentUrl(anchor) {
  if (!(anchor instanceof HTMLAnchorElement)) return null;
  if (anchor.target && anchor.target !== "_self") return null;
  if (anchor.hasAttribute("download")) return null;

  let url;
  try {
    url = new URL(anchor.href, location.href);
  } catch {
    return null;
  }

  if (url.origin !== location.origin || !["http:", "https:"].includes(url.protocol)) return null;
  if (normalizedPath(url.pathname) === normalizedPath(location.pathname) && url.search === location.search) return null;
  url.hash = "";
  return url;
}

function warmModule(pathname) {
  const moduleHref = routeModules.get(normalizedPath(pathname));
  if (!moduleHref || warmedModules.has(moduleHref)) return;
  warmedModules.add(moduleHref);

  const preload = document.createElement("link");
  preload.rel = "modulepreload";
  preload.href = moduleHref;
  preload.fetchPriority = "low";
  document.head.append(preload);
}

function warmDocument(url, { includeModule = true } = {}) {
  if (!url || warmedDocuments.has(url.href) || !connectionAllowsWarmup()) return;
  warmedDocuments.add(url.href);

  fetch(url.href, {
    method: "GET",
    credentials: "same-origin",
    cache: "force-cache",
    headers: { "X-TAS-Purpose": "navigation-warmup" }
  }).catch(() => {
    warmedDocuments.delete(url.href);
  });

  if (includeModule) warmModule(url.pathname);
}

function anchorFromEvent(event) {
  const target = event.target instanceof Element ? event.target : null;
  return target?.closest("a[href]") || null;
}

export function setupNavigationWarmup(root = document) {
  if (typeof window === "undefined" || window[NAVIGATION_WARMUP_GUARD]) return;
  window[NAVIGATION_WARMUP_GUARD] = true;

  const warmFromEvent = event => warmDocument(internalDocumentUrl(anchorFromEvent(event)));
  root.addEventListener("pointerover", warmFromEvent, { passive: true, capture: true });
  root.addEventListener("focusin", warmFromEvent, { passive: true, capture: true });
  root.addEventListener("touchstart", warmFromEvent, { passive: true, capture: true });

  const warmPrimaryRoutes = () => {
    if (!connectionAllowsBroadWarmup() || document.visibilityState !== "visible") return;
    const anchors = [...root.querySelectorAll("[data-nav] a[href]")]
      .map(internalDocumentUrl)
      .filter(Boolean)
      .slice(0, 8);
    anchors.forEach((url, index) => {
      window.setTimeout(() => warmDocument(url, { includeModule: index < 4 }), index * 140);
    });
  };

  const schedulePrimaryWarmup = () => {
    if ("requestIdleCallback" in window) {
      window.requestIdleCallback(warmPrimaryRoutes, { timeout: 2200 });
    } else {
      window.setTimeout(warmPrimaryRoutes, 1400);
    }
  };

  if (document.readyState === "complete") schedulePrimaryWarmup();
  else window.addEventListener("load", schedulePrimaryWarmup, { once: true });
}
