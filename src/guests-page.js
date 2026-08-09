import { MediaHeader, setupMediaNavigation } from "./components/MediaHeader.js";
import { Footer } from "./components/Footer.js";
import { enrichEpisode, episodes as curatedEpisodes, guests as curatedGuests } from "./data/catalog.js";
import { CANDIDATES_LABEL, isVerifiedCandidateGuest } from "./data/collections.js";
import { escapeHtml } from "./lib/utils.js";
import { setupEditorialMotion } from "./lib/motion.js";
import { buildGuestDirectory, filterGuests, guestConversationPath } from "./lib/guest-directory.js";
import { loadYouTubeFeed } from "./lib/youtube-feed.js";

const app = document.querySelector("#app");
app.innerHTML = `${MediaHeader()}<main id="main-content">
  <section class="media-hero"><div class="shell media-hero-inner">
    <nav class="breadcrumbs" aria-label="Breadcrumb"><ol><li><a href="/">Home</a></li><li aria-current="page">Guests</li></ol></nav>
    <p class="eyebrow"><span></span> People in conversation</p><h1>Guests</h1>
    <p>Browse the verified guests who have joined The Alana Show.</p>
  </div></section>
  <section class="media-section archive-section" aria-labelledby="directory-heading" data-reveal><div class="shell">
    <div class="media-section-heading"><div><p class="eyebrow dark"><span></span> Guest directory</p><h2 id="directory-heading">Browse alphabetically</h2></div></div>
    <form class="guest-search" role="search"><label><span>Search by guest name</span><input type="search" data-guest-query placeholder="Guest name" autocomplete="off"></label></form>
    <nav class="alphabet-nav" aria-label="Filter guests by first letter" data-alphabet></nav>
    <p class="archive-status" data-guest-status role="status" aria-live="polite"></p>
    <div class="guest-grid" data-guest-grid></div>
  </div></section>
</main>${Footer({ fromSubpage: true })}`;

let guests = buildGuestDirectory(curatedEpisodes.map(enrichEpisode), curatedGuests);
let episodeRecords = curatedEpisodes;
let query = "";
let letter = "";
const alphabet = document.querySelector("[data-alphabet]");

function renderAlphabet() {
  const initials = new Set(guests.map(guest => guest.surname[0].toUpperCase()));
  alphabet.innerHTML = `<button type="button" aria-pressed="${String(!letter)}" data-letter="">All</button>${"ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("").map(item => `<button type="button" data-letter="${item}" aria-pressed="${String(letter === item)}"${initials.has(item) ? "" : " disabled"}>${item}</button>`).join("")}`;
}

function guestCard(guest) {
  const guestPath = guestConversationPath(guest);
  return `<article class="guest-card" data-reveal data-reveal-stagger="true"><div class="guest-monogram" aria-hidden="true">${escapeHtml(guest.name.split(/\s+/).map(part => part[0]).slice(0, 2).join(""))}</div>
    <div><p class="content-label">Guest</p><h3><a href="${guestPath}">${escapeHtml(guest.name)}</a></h3>
    ${isVerifiedCandidateGuest(guest, episodeRecords) ? `<p class="candidate-label">${CANDIDATES_LABEL}</p>` : ""}
    ${guest.organization ? `<p>${escapeHtml(guest.organization)}</p>` : ""}
    ${guest.conversationCount ? `<p><a href="${guestPath}">View conversations</a></p>` : ""}</div></article>`;
}

function render({ error = false } = {}) {
  const matches = filterGuests(guests, query, letter);
  const conversations = new Set(guests.flatMap(guest => guest.videoIds || [])).size || episodeRecords.length;
  const errorNote = error ? " Live archive unavailable; showing curated guest records." : "";
  document.querySelector("[data-guest-status]").textContent = `${guests.length} guest${guests.length === 1 ? "" : "s"} across ${conversations} conversation${conversations === 1 ? "" : "s"}.${errorNote}`;
  const grid = document.querySelector("[data-guest-grid]");
  grid.innerHTML = matches.length ? matches.map(guestCard).join("") : `<div class="media-empty"><h3>No guests found</h3><p>Try another name or letter.</p></div>`;
  setupEditorialMotion(grid);
}

async function load() {
  renderAlphabet();
  render();
  try {
    const data = await loadYouTubeFeed();
    episodeRecords = (data.episodes || []).map(enrichEpisode);
    guests = buildGuestDirectory(episodeRecords, curatedGuests);
    renderAlphabet();
    render();
  } catch {
    render({ error: true });
  }
}

document.querySelector("[data-guest-query]").addEventListener("input", event => { query = event.target.value.trim(); render(); });
alphabet.addEventListener("click", event => {
  const button = event.target.closest("button[data-letter]"); if (!button) return;
  letter = button.dataset.letter; alphabet.querySelectorAll("button").forEach(item => item.setAttribute("aria-pressed", String(item === button))); render();
});
setupMediaNavigation(); setupEditorialMotion(app); render();
load();
