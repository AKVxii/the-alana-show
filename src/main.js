import { Header } from "./components/Header.js";
import { Hero } from "./components/Hero.js";
import { Broadcast } from "./components/Broadcast.js";
import { Platforms } from "./components/Platforms.js";
import { Episodes } from "./components/Episodes.js";
import { Impact } from "./components/Impact.js";
import { About } from "./components/About.js";
import { Partner } from "./components/Partner.js";
import { Contact } from "./components/Contact.js";
import { Footer } from "./components/Footer.js";
import { SearchDialog } from "./components/SearchDialog.js";
import { Conversions } from "./components/Conversions.js";
import { icon } from "./lib/icons.js";
import { site } from "./data/site.js";
import { compactNumber, escapeHtml, excerpt, formatDate, formatDuration, nextBroadcastLabel } from "./lib/utils.js";

const app = document.querySelector("#app");

app.innerHTML = `
  ${Header()}
  <main id="main-content">
    ${Hero()}
    ${Broadcast()}
    ${Platforms()}
    ${Episodes()}
    ${Impact()}
    ${About()}
    ${Conversions()}
    ${Partner()}
    ${Contact()}
  </main>
  ${Footer()}
  ${SearchDialog()}
`;

const state = { episodes: [] };

function setupNavigation() {
  const menuButton = document.querySelector("[data-menu-button]");
  const nav = document.querySelector("[data-nav]");
  const menuLabel = menuButton?.querySelector(".sr-only");
  const setMenuState = open => {
    nav?.classList.toggle("open", open);
    document.body.classList.toggle("menu-open", open);
    menuButton?.setAttribute("aria-expanded", String(open));
    if (menuLabel) menuLabel.textContent = open ? "Close navigation" : "Open navigation";
  };
  menuButton?.addEventListener("click", () => {
    setMenuState(!nav?.classList.contains("open"));
  });
  nav?.querySelectorAll("a").forEach(link => link.addEventListener("click", () => {
    setMenuState(false);
  }));

  document.addEventListener("keydown", event => {
    if (event.key === "Escape" && nav?.classList.contains("open")) {
      setMenuState(false);
      menuButton?.focus();
    }
  });

  const header = document.querySelector("[data-header]");
  const updateHeader = () => header?.classList.toggle("scrolled", window.scrollY > 18);
  updateHeader();
  window.addEventListener("scroll", updateHeader, { passive: true });
}

function setupReveals() {
  const nodes = document.querySelectorAll(".reveal");
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || !("IntersectionObserver" in window)) {
    nodes.forEach(node => node.classList.add("visible"));
    return;
  }
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add("visible");
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: .12, rootMargin: "0px 0px -45px" });
  nodes.forEach(node => observer.observe(node));
}

function setupBroadcastStatus() {
  const status = nextBroadcastLabel();
  const element = document.querySelector("[data-broadcast-status]");
  if (!element) return;
  element.innerHTML = `<span></span> ${status.label}`;
  element.classList.toggle("live", status.live);
}

function setupInquiryLinks() {
  document.querySelectorAll("[data-inquiry]").forEach(link => {
    link.addEventListener("click", () => {
      const select = document.querySelector("[data-inquiry-select]");
      if (!select) return;
      const requested = link.dataset.inquiry;
      const exists = [...select.options].some(option => option.value === requested);
      if (!exists) return;
      select.value = requested;
      window.requestAnimationFrame(() => select.focus({ preventScroll: true }));
    });
  });
}

function episodeCard(episode) {
  const videoUrl = `https://www.youtube.com/watch?v=${encodeURIComponent(episode.videoId)}`;
  return `
    <article class="episode-card">
      <a class="episode-thumb" href="${videoUrl}" target="_blank" rel="noopener" aria-label="Watch ${escapeHtml(episode.title)}">
        <img src="${escapeHtml(episode.thumbnail)}" alt="" loading="lazy">
        <span class="episode-play">${icon("play")}</span>
        <small>${escapeHtml(formatDuration(episode.durationSeconds))}</small>
      </a>
      <div class="episode-body">
        <span>${escapeHtml(formatDate(episode.publishedAt))}</span>
        <h3>${escapeHtml(episode.title)}</h3>
        <p>${escapeHtml(excerpt(episode.description, 120))}</p>
        <a href="${videoUrl}" target="_blank" rel="noopener">Watch conversation ${icon("arrow")}</a>
      </div>
    </article>
  `;
}

function renderEpisodes(episodes) {
  const rail = document.querySelector("[data-episode-rail]");
  if (!rail) return;
  rail.innerHTML = episodes.slice(0, 8).map(episodeCard).join("");
}

function updateFeatured(episode) {
  if (!episode?.videoId) return;
  const video = document.querySelector("[data-featured-video]");
  video.src = `https://www.youtube-nocookie.com/embed/${episode.videoId}?rel=0`;
  document.querySelector("[data-featured-title]").textContent = episode.title;
  document.querySelector("[data-featured-description]").textContent = excerpt(episode.description, 250) || "A featured conversation from The Alana Show.";
  const stats = [formatDate(episode.publishedAt), episode.viewCount ? `${compactNumber(episode.viewCount)} views` : ""].filter(Boolean);
  document.querySelector("[data-featured-stats]").textContent = stats.join(" · ");
}

function updateLatest(episode) {
  if (!episode?.videoId) return;
  const thumb = document.querySelector("[data-latest-thumb]");
  thumb.style.backgroundImage = `linear-gradient(180deg, transparent, rgba(6,16,32,.82)), url("${episode.thumbnail}")`;
  document.querySelector("[data-latest-title]").textContent = episode.title;
  document.querySelector("[data-latest-description]").textContent = excerpt(episode.description, 145) || `Published ${formatDate(episode.publishedAt)}.`;
  document.querySelector("[data-latest-link]").href = `https://www.youtube.com/watch?v=${episode.videoId}`;
}

async function loadYouTube() {
  try {
    const response = await fetch("/api/youtube", { headers: { Accept: "application/json" } });
    if (!response.ok) throw new Error("YouTube feed unavailable");
    const data = await response.json();
    state.episodes = data.recent || data.episodes || [];
    updateFeatured(data.featured || data.mostWatched || data.latest);
    updateLatest(data.latest);
    renderEpisodes(data.recent || state.episodes);
    renderSearchResults("");
  } catch (error) {
    console.info("Using the curated fallback episode while the YouTube feed is unavailable.");
    const rail = document.querySelector("[data-episode-rail]");
    if (rail) rail.innerHTML = `<div class="episode-fallback"><strong>Explore every conversation on YouTube.</strong><a class="button button-gold" href="${site.youtube}" target="_blank" rel="noopener">Visit the channel ${icon("arrow")}</a></div>`;
    state.episodes = [];
    renderSearchResults("");
  }
}

function searchResult(episode) {
  const videoUrl = `https://www.youtube.com/watch?v=${encodeURIComponent(episode.videoId)}`;
  return `<a class="search-result" href="${videoUrl}" target="_blank" rel="noopener">
    <img src="${escapeHtml(episode.thumbnail)}" alt="" loading="lazy">
    <span><small>${escapeHtml(formatDate(episode.publishedAt))}</small><strong>${escapeHtml(episode.title)}</strong><p>${escapeHtml(excerpt(episode.description, 110))}</p></span>
    ${icon("arrow")}
  </a>`;
}

function renderSearchResults(query) {
  const container = document.querySelector("[data-search-results]");
  if (!container) return;
  const normalized = query.trim().toLowerCase();
  if (!state.episodes.length) {
    container.innerHTML = `<div class="search-empty"><p>Recent search is temporarily unavailable.</p><a href="${site.youtube}" target="_blank" rel="noopener">Visit The Alana Show on YouTube ${icon("arrow")}</a></div>`;
    return;
  }
  const matches = state.episodes.filter(episode => {
    const haystack = `${episode.title} ${episode.description}`.toLowerCase();
    return !normalized || haystack.includes(normalized);
  }).slice(0, 12);
  if (normalized && !matches.length) {
    container.innerHTML = `<p class="search-empty">No conversations matched “${escapeHtml(query)}.” Try another guest or topic.</p>`;
    return;
  }
  container.innerHTML = matches.map(searchResult).join("");
}

function setupSearch() {
  const dialog = document.querySelector("[data-search-dialog]");
  const input = document.querySelector("[data-search-input]");
  let opener = null;
  const open = event => {
    if (!dialog || !input || typeof dialog.showModal !== "function") return;
    opener = event?.currentTarget || document.activeElement;
    if (dialog.open) return;
    dialog.showModal();
    setTimeout(() => input.focus(), 50);
    renderSearchResults(input.value);
  };
  const close = () => {
    if (!dialog?.open || typeof dialog.close !== "function") return;
    dialog.close();
    opener?.focus?.({ preventScroll: true });
  };
  document.querySelectorAll("[data-search-open]").forEach(button => button.addEventListener("click", open));
  document.querySelector("[data-search-close]")?.addEventListener("click", close);
  dialog?.addEventListener("click", event => { if (event.target === dialog) close(); });
  input?.addEventListener("input", () => renderSearchResults(input.value));
  document.querySelectorAll("[data-search-chip]").forEach(button => button.addEventListener("click", () => {
    input.value = button.dataset.searchChip;
    renderSearchResults(input.value);
  }));
  window.addEventListener("keydown", event => {
    if (event.key === "Escape" && dialog?.open) close();
    const active = document.activeElement;
    const typing = ["INPUT", "TEXTAREA", "SELECT"].includes(active?.tagName) || active?.isContentEditable;
    if (event.key === "/" && !typing) {
      event.preventDefault();
      open();
    }
  });
}

function setupContactForm() {
  const form = document.querySelector("[data-contact-form]");
  const status = document.querySelector("[data-form-status]");
  if (!form) return;
  form.addEventListener("submit", async event => {
    event.preventDefault();
    status.textContent = "";
    status.classList.remove("success");
    form.setAttribute("aria-busy", "false");
    const data = Object.fromEntries(new FormData(form).entries());
    if (!form.checkValidity()) {
      form.reportValidity();
      status.textContent = "Please complete the required fields.";
      return;
    }
    const button = form.querySelector('button[type="submit"]');
    form.setAttribute("aria-busy", "true");
    button.disabled = true;
    button.dataset.original = button.innerHTML;
    button.textContent = "Sending…";
    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Unable to send");
      form.reset();
      status.textContent = "Thank you. Your inquiry has been sent to The Alana Show.";
      status.classList.add("success");
    } catch (error) {
      status.textContent = "Your message could not be sent. Please email Alana@AlanaKVandeveer.com.";
      status.classList.remove("success");
    } finally {
      form.setAttribute("aria-busy", "false");
      button.disabled = false;
      button.innerHTML = button.dataset.original;
    }
  });
}

function setupYear() {
  document.querySelectorAll("[data-year]").forEach(node => node.textContent = new Date().getFullYear());
}

setupNavigation();
setupReveals();
setupBroadcastStatus();
setupInquiryLinks();
setupSearch();
setupContactForm();
setupYear();
loadYouTube();
