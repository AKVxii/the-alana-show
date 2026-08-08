import { icon } from "../lib/icons.js";
import { site } from "../data/site.js";
import { setupMeasurement } from "../lib/measurement.js";

export function Header() {
  setupMeasurement();
  return `
    <header class="site-header" data-header>
      <div class="shell header-inner">
        <a class="brand" href="#home" aria-label="The Alana Show home">
          <span class="brand-seal" aria-hidden="true">TAS</span>
          <span class="brand-copy">
            <strong>The Alana Show</strong>
            <span>Real conversations. Distinct voices.</span>
          </span>
        </a>

        <button class="menu-button" type="button" aria-expanded="false" aria-controls="primary-nav" data-menu-button>
          <span class="sr-only">Open navigation</span>
          ${icon("menu")}
        </button>

        <nav id="primary-nav" class="primary-nav" aria-label="Primary navigation" data-nav>
          <a href="#home">Home</a>
          <a href="/episodes/">Episodes</a>
          <a href="/guests/">Guests</a>
          <a href="/topics/">Topics</a>
          <a href="/specials/">Specials</a>
          <a href="/south-florida/">South Florida</a>
          <a href="#listen">Listen</a>
          <a href="#on-air">On Air</a>
          <a href="#about">About</a>
          <a href="#contact">Contact</a>
        </nav>

        <div class="header-actions">
          <button class="search-trigger" type="button" data-search-open aria-label="Search episodes">
            ${icon("search")}
            <span>Search</span>
            <kbd>/</kbd>
          </button>
          <a class="button button-gold button-small" href="${site.trueOldies}" target="_blank" rel="noopener">True Oldies</a>
        </div>
      </div>
    </header>
  `;
}
