import { icon } from "../lib/icons.js";
import { site } from "../data/site.js";

export function Header() {
  return `
    <header class="site-header" data-header>
      <div class="shell header-inner">
        <a class="brand" href="#home" aria-label="Alana — All Over the Place home">
          <span class="brand-seal" aria-hidden="true">AOP</span>
          <span class="brand-copy">
            <strong>ALANA</strong>
            <span>All Over the Place</span>
          </span>
        </a>

        <button class="menu-button" type="button" aria-expanded="false" aria-controls="primary-nav" data-menu-button>
          <span class="sr-only">Open navigation</span>
          ${icon("menu")}
        </button>

        <nav id="primary-nav" class="primary-nav" aria-label="Primary navigation" data-nav>
          <a href="#watch">Watch</a>
          <a href="#about">Alana</a>
          <a href="#contact">Contact</a>
          <a class="mobile-listen-live" href="${site.trueOldiesLive}" target="_blank" rel="noopener">Listen Live</a>
        </nav>

        <div class="header-actions">
          <a class="button button-gold button-small" href="${site.trueOldiesLive}" target="_blank" rel="noopener">Listen Live</a>
        </div>
      </div>
    </header>
  `;
}
