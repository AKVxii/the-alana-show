import { icon } from "../lib/icons.js";
import { site } from "../data/site.js";

export function SearchDialog() {
  return `
    <dialog class="search-dialog" data-search-dialog>
      <div class="search-panel">
        <div class="search-topline">
          <div>
            <span>Conversation finder</span>
            <strong>Search The Alana Show</strong>
          </div>
          <button type="button" data-search-close aria-label="Close episode search">${icon("close")}</button>
        </div>

        <label class="search-input-wrap">
          ${icon("search")}
          <input type="search" placeholder="Try leadership, veterans, healthcare, AI…" autocomplete="off" data-search-input>
          <kbd>ESC</kbd>
        </label>

        <div class="search-chips" aria-label="Suggested topics">
          ${site.topics.map(topic => `<button type="button" data-search-chip="${topic}">${topic}</button>`).join("")}
        </div>

        <div class="search-results" data-search-results>
          <p class="search-empty">Episodes will appear here as the live YouTube library loads.</p>
        </div>
      </div>
    </dialog>
  `;
}
