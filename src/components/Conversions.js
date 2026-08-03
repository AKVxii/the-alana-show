import { icon } from "../lib/icons.js";

const cards = [
  ["Support the Show", "Help thoughtful, independent conversations continue.", "#contact", "Support the show"],
  ["Partner With Us", "Explore an editorially independent collaboration.", "#partner", ""],
  ["Listen On Air", "Find The Alana Show on True Oldies in South Florida.", "#on-air", ""],
  ["Join the Conversation", "Recommend a guest, organization, or story.", "#contact", "Recommend a guest"]
];

export function Conversions() {
  return `
    <section class="conversion-section" aria-label="Ways to connect">
      <div class="shell conversion-grid">
        ${cards.map(([title, copy, href, inquiry], index) => `
          <a class="conversion-card reveal" style="--delay:${index * 55}ms" href="${href}"${inquiry ? ` data-inquiry="${inquiry}"` : ""}>
            <span>0${index + 1}</span>
            <strong>${title}</strong>
            <small>${copy}</small>
            ${icon("arrow")}
          </a>
        `).join("")}
      </div>
    </section>
  `;
}
