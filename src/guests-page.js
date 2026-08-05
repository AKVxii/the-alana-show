import { MediaHeader, setupMediaNavigation } from "./components/MediaHeader.js";
import { Footer } from "./components/Footer.js";
import { guests } from "./data/catalog.js";
import { escapeHtml } from "./lib/utils.js";

const app = document.querySelector("#app");
app.innerHTML = `${MediaHeader()}<main id="main-content">
  <section class="media-hero"><div class="shell media-hero-inner">
    <nav class="breadcrumbs" aria-label="Breadcrumb"><ol><li><a href="/">Home</a></li><li aria-current="page">Guests</li></ol></nav>
    <p class="eyebrow"><span></span> People in conversation</p><h1>Guests</h1>
    <p>Browse the verified guests who have joined The Alana Show.</p>
  </div></section>
  <section class="media-section archive-section" aria-labelledby="directory-heading"><div class="shell">
    <div class="media-section-heading"><div><p class="eyebrow dark"><span></span> Guest directory</p><h2 id="directory-heading">Browse alphabetically</h2></div></div>
    <form class="guest-search" role="search"><label><span>Search by guest name</span><input type="search" data-guest-query placeholder="Guest name" autocomplete="off"></label></form>
    <nav class="alphabet-nav" aria-label="Filter guests by first letter" data-alphabet></nav>
    <p class="archive-status" data-guest-status role="status" aria-live="polite"></p>
    <div class="guest-grid" data-guest-grid></div>
  </div></section>
</main>${Footer({ fromSubpage: true })}`;

let query = "";
let letter = "";
const initials = [...new Set(guests.map(guest => guest.name[0].toUpperCase()))].sort();
const alphabet = document.querySelector("[data-alphabet]");
alphabet.innerHTML = `<button type="button" aria-pressed="true" data-letter="">All</button>${"ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("").map(item => `<button type="button" data-letter="${item}" aria-pressed="false"${initials.includes(item) ? "" : " disabled"}>${item}</button>`).join("")}`;

function guestCard(guest) {
  const guestPath = `/guests/${guest.id}/`;
  return `<article class="guest-card"><div class="guest-monogram" aria-hidden="true">${escapeHtml(guest.name.split(/\s+/).map(part => part[0]).slice(0, 2).join(""))}</div>
    <div><p class="content-label">Guest</p><h3><a href="${guestPath}">${escapeHtml(guest.name)}</a></h3>
    ${guest.organization ? `<p>${escapeHtml(guest.organization)}</p>` : ""}
    ${guest.episodeIds.length ? `<p><a href="${guestPath}">View conversations</a></p>` : ""}</div></article>`;
}

function render() {
  const matches = guests.filter(guest => (!letter || guest.name.toUpperCase().startsWith(letter)) && guest.name.toLowerCase().includes(query.toLowerCase()));
  document.querySelector("[data-guest-status]").textContent = `${matches.length} verified guest${matches.length === 1 ? "" : "s"}.`;
  document.querySelector("[data-guest-grid]").innerHTML = matches.length ? matches.map(guestCard).join("") : `<div class="media-empty"><h3>No guests found</h3><p>Try another name or letter.</p></div>`;
}

document.querySelector("[data-guest-query]").addEventListener("input", event => { query = event.target.value.trim(); render(); });
alphabet.addEventListener("click", event => {
  const button = event.target.closest("button[data-letter]"); if (!button) return;
  letter = button.dataset.letter; alphabet.querySelectorAll("button").forEach(item => item.setAttribute("aria-pressed", String(item === button))); render();
});
setupMediaNavigation(); render();
