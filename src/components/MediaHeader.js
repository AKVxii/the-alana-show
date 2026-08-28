import { icon } from "../lib/icons.js";
import { site } from "../data/site.js";
import { setupMeasurement } from "../lib/measurement.js";
import { setupCampaignMeasurement } from "../lib/campaign-measurement.js";
import { setupNavigationWarmup } from "../lib/navigation-prefetch.js";

function setupEpisodeEnhancements() {
  if (document.body.dataset.detailType !== "episode") return;

  const load = async () => {
    try {
      const [
        { setupConversationShare },
        { setupEpisodeEngagement },
        { setupEpisodeEditorial },
        { setupEpisodePromotion }
      ] = await Promise.all([
        import("../lib/share.js"),
        import("../lib/episode-engagement.js"),
        import("../lib/episode-editorial.js"),
        import("../lib/episode-promotion.js")
      ]);
      setupConversationShare();
      setupEpisodeEngagement();
      setupEpisodeEditorial();
      setupEpisodePromotion();
    } catch {
      // The complete server-delivered episode remains usable if an enhancement fails to load.
    }
  };

  if ("requestAnimationFrame" in window) {
    window.requestAnimationFrame(() => window.setTimeout(load, 0));
    return;
  }
  window.setTimeout(load, 0);
}

function ensureMediaPolishStyles() {
  if (document.querySelector('link[data-media-polish], link[href^="/src/media-polish.css"]')) return;
  const stylesheet = document.createElement("link");
  stylesheet.rel = "stylesheet";
  stylesheet.href = "/src/media-polish.css?v=20260825-smooth";
  stylesheet.dataset.mediaPolish = "true";
  document.head.append(stylesheet);
}

export function MediaHeader() {
  return `<header class="site-header media-site-header" data-header>
    <div class="shell header-inner">
      <a class="brand" href="/" aria-label="Alana — All Over the Place home">
        <span class="brand-seal" aria-hidden="true">AOP</span>
        <span class="brand-copy"><strong>Alana — All Over the Place</strong><span>Real conversations. Distinct voices.</span></span>
      </a>
      <button class="menu-button" type="button" aria-expanded="false" aria-controls="primary-nav" data-menu-button>
        <span class="sr-only">Open navigation</span>${icon("menu")}
      </button>
      <nav id="primary-nav" class="primary-nav" aria-label="Primary navigation" data-nav>
        <a href="/episodes/">Watch</a>
        <a href="/guests/">Guests</a>
        <a href="/topics/">Topics</a>
        <a href="/candidates/">Candidates</a>
        <a href="/south-florida/">South Florida</a>
        <a href="/about/">About</a>
        <a href="/merchandise/">Merchandise</a>
        <a href="/#contact">Contact</a>
        <a class="mobile-listen-live" href="${site.trueOldiesLive}" target="_blank" rel="noopener">Listen Live</a>
      </nav>
      <div class="header-actions"><a class="button button-gold button-small" href="${site.trueOldiesLive}" target="_blank" rel="noopener">Listen Live</a></div>
    </div>
  </header>`;
}

export function setupMediaNavigation() {
  ensureMediaPolishStyles();
  setupMeasurement();
  setupCampaignMeasurement();
  setupNavigationWarmup();
  const button = document.querySelector("[data-menu-button]");
  const nav = document.querySelector("[data-nav]");
  const label = button?.querySelector(".sr-only");
  const links = [...(nav?.querySelectorAll("a") || [])];

  const normalizePath = value => {
    const pathname = new URL(value, location.origin).pathname;
    return pathname === "/" ? "/" : pathname.replace(/\/+$/, "");
  };
  const currentPath = normalizePath(location.href);
  links.forEach(link => {
    const href = link.getAttribute("href") || "";
    if (href.startsWith("/#")) return;
    const linkPath = normalizePath(link.href);
    const isCurrent = linkPath === currentPath || (linkPath !== "/" && currentPath.startsWith(`${linkPath}/`));
    if (isCurrent) link.setAttribute("aria-current", "page");
  });

  const setOpen = (open, { focusFirst = false, restoreFocus = false } = {}) => {
    nav?.classList.toggle("open", open);
    document.body.classList.toggle("menu-open", open);
    button?.setAttribute("aria-expanded", String(open));
    if (label) label.textContent = open ? "Close navigation" : "Open navigation";
    if (open && focusFirst) window.requestAnimationFrame(() => links[0]?.focus());
    if (!open && restoreFocus) window.requestAnimationFrame(() => button?.focus());
  };

  button?.addEventListener("click", () => {
    const opening = !nav?.classList.contains("open");
    setOpen(opening, { focusFirst: opening });
  });
  links.forEach(link => link.addEventListener("click", event => {
    if (link.getAttribute("aria-current") === "page") {
      event.preventDefault();
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
    setOpen(false);
  }));
  document.addEventListener("keydown", event => {
    if (event.key === "Escape" && nav?.classList.contains("open")) {
      setOpen(false, { restoreFocus: true });
    }
  });
  document.querySelectorAll("[data-year]").forEach(node => { node.textContent = new Date().getFullYear(); });
  setupEpisodeEnhancements();
}
