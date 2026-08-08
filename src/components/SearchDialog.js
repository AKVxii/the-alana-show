import { icon } from "../lib/icons.js";
import { site } from "../data/site.js";

export function SearchDialog() {
  return `
    <dialog class="search-dialog" data-search-dialog aria-labelledby="site-search-title">
      <div class="search-panel">
        <div class="search-topline">
          <div>
            <span>Conversation finder</span>
            <strong id="site-search-title">Search recent conversations</strong>
          </div>
          <button type="button" data-search-close aria-label="Close episode search">${icon("close")}</button>
        </div>

        <label class="search-input-wrap">
          <span class="sr-only">Search recent conversations by guest, topic, category, or idea</span>
          ${icon("search")}
          <input type="search" placeholder="Try leadership, veterans, healthcare, AI…" autocomplete="off" data-search-input>
          <kbd>ESC</kbd>
        </label>

        <div class="search-chips" aria-label="Filter by category">
          ${site.topics.map(topic => `<button type="button" aria-pressed="false" data-search-chip="${topic}">${topic}</button>`).join("")}
        </div>

        <p class="search-status" aria-live="polite" data-search-status>Search by guest, topic, category, or idea.</p>
        <div class="search-results" data-search-results>
          <p class="search-empty">Search by guest, topic, category, or idea.</p>
        </div>
      </div>
    </dialog>
  `;
}
