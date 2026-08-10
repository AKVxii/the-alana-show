import { icon } from "../lib/icons.js";
import { site } from "../data/site.js";
import { setupMeasurement } from "../lib/measurement.js";

function ensureMediaEditorialStyles() {
  document.documentElement.style.backgroundColor = "#030914";
  document.body.style.backgroundColor = "#030914";

  const stylesheets = [
    { selector: 'link[data-media-editorial]', href: "/src/media-editorial.css?v=1", dataset: "mediaEditorial" },
    { selector: 'link[data-visual-qa]', href: "/src/visual-qa-refinement.css?v=1", dataset: "visualQa" },
    { selector: 'link[data-mobile-qa-final]', href: "/src/mobile-qa-final.css?v=1", dataset: "mobileQaFinal" },
    { selector: 'link[data-archive-character]', href: "/src/archive-character.css?v=1", dataset: "archiveCharacter" }
  ];

  stylesheets.forEach(({ selector, href, dataset }) => {
    if (document.querySelector(selector)) return;
    const stylesheet = document.createElement("link");
    stylesheet.rel = "stylesheet";
    stylesheet.href = href;
    stylesheet.dataset[dataset] = "true";
    document.head.append(stylesheet);
  });
}

export function MediaHeader() {
  ensureMediaEditorialStyles();
  setupMeasurement();
  return `<header class="site-header media-site-header" data-header>
    <div class="shell header-inner">
      <a class="brand" href="/" aria-label="The Alana Show home">
        <span class="brand-seal" aria-hidden="true">TAS</span>
        <span class="brand-copy"><strong>The Alana Show</strong><span>Real conversations. Distinct voices.</span></span>
      </a>
      <button class="menu-button" type="button" aria-expanded="false" aria-controls="primary-nav" data-menu-button>
        <span class="sr-only">Open navigation</span>${icon("menu")}
      </button>
      <nav id="primary-nav" class="primary-nav" aria-label="Primary navigation" data-nav>
        <a href="/episodes/">Watch</a>
        <a href="/guests/">Guests</a>
        <a href="/topics/">Topics</a>
        <a href="/south-florida/">South Florida</a>
        <a href="/#about">About</a>
        <a href="/advertise/">Partner</a>
        <a href="/#contact">Contact</a>
        <a class="mobile-listen-live" href="${site.trueOldiesLive}" target="_blank" rel="noopener">Listen Live</a>
      </nav>
      <div class="header-actions"><a class="button button-gold button-small" href="${site.trueOldiesLive}" target="_blank" rel="noopener">Listen Live</a></div>
    </div>
  </header>`;
}

export function setupMediaNavigation() {
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
  links.forEach(link => link.addEventListener("click", () => setOpen(false)));
  document.addEventListener("keydown", event => {
    if (event.key === "Escape" && nav?.classList.contains("open")) {
      setOpen(false, { restoreFocus: true });
    }
  });
  document.querySelectorAll("[data-year]").forEach(node => { node.textContent = new Date().getFullYear(); });
}
