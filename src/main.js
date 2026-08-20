import { Header } from "./components/Header.js";
import { Hero } from "./components/Hero.js";
import { Conversions } from "./components/Conversions.js";
import { Platforms } from "./components/Platforms.js";
import { EpisodeThumbnail, Episodes, isUsableThumbnailUrl, revealThumbnailFallback } from "./components/Episodes.js";
import { Impact } from "./components/Impact.js";
import { About } from "./components/About.js";
import { Partner } from "./components/Partner.js";
import { Merchandise } from "./components/Merchandise.js";
import { Contact } from "./components/Contact.js";
import { Footer } from "./components/Footer.js";
import { SearchDialog } from "./components/SearchDialog.js";
import { icon } from "./lib/icons.js";
import { site } from "./data/site.js";
import { enrichEpisode, episodes as editorialEpisodes } from "./data/catalog.js";
import { compactNumber, escapeHtml, excerpt, formatDate, formatDuration, isValidWebsiteOrSocial, nextBroadcastLabel, normalizeWebsiteOrSocial } from "./lib/utils.js";
import { mergeEpisodeSources, searchEpisodes } from "./lib/episode-search.js";
import { setupEditorialMotion } from "./lib/motion.js";
import { lengthBucket, trackEvent } from "./lib/measurement.js";
import { loadYouTubeFeed } from "./lib/youtube-feed.js";
import { setupNewsletter } from "./newsletter.js";

const FEATURED_CONVERSATION_VIDEO_ID = "Kx7rcDzaqDk";
const app = document.querySelector("#app");

app.innerHTML = `
  ${Header()}
  <main id="main-content">
    ${Hero()}
    ${Conversions()}
    ${Episodes()}
    ${Platforms()}
    ${Impact()}
    ${About()}
    ${Partner()}
    ${Merchandise()}
    ${Contact()}
  </main>
  ${Footer()}
  ${SearchDialog()}
`;

const state = { episodes: [], selectedCategory: "" };

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
  setupEditorialMotion();
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
  const enriched = enrichEpisode(episode);
  const youtubeUrl = `https://www.youtube.com/watch?v=${encodeURIComponent(enriched.videoId)}`;
  const cardUrl = enriched.detailPath || youtubeUrl;
  const external = !enriched.detailPath;
  const linkAttrs = external ? ' target="_blank" rel="noopener"' : "";
  const dateLabel = formatDate(enriched.publishedAt) || "Verified conversation";
  const summary = excerpt(enriched.deck || enriched.description, 120) || "A verified conversation from The Alana Show archive.";
  return `
    <article class="episode-card">
      <a class="episode-thumb" href="${cardUrl}"${linkAttrs} aria-label="Watch ${escapeHtml(enriched.title)}">
        ${EpisodeThumbnail(enriched, { latest: false })}
        <span class="episode-play">${icon("play")}</span>
        <small>${escapeHtml(formatDuration(enriched.durationSeconds))}</small>
      </a>
      <div class="episode-body">
        <span>${escapeHtml(dateLabel)}</span>
        <h3>${escapeHtml(enriched.title)}</h3>
        <p>${escapeHtml(summary)}</p>
        <a href="${cardUrl}"${linkAttrs}>Watch conversation ${icon("arrow")}</a>
      </div>
    </article>
  `;
}

function renderEpisodes(episodes) {
  const rail = document.querySelector("[data-episode-rail]");
  if (!rail) return;
  rail.innerHTML = episodes.slice(0, 8).map(episodeCard).join("");
  setupThumbnailFallbacks(rail);
}

function setupThumbnailFallbacks(root = document) {
  root.querySelectorAll("[data-thumbnail-frame]").forEach(frame => {
    const image = frame.querySelector("img");
    if (!image || image.dataset.fallbackBound) return;
    image.dataset.fallbackBound = "true";
    image.addEventListener("load", () => frame.classList.remove("fallback-visible"));
    image.addEventListener("error", () => revealThumbnailFallback(frame, image));
    if (image.complete && image.naturalWidth === 0) revealThumbnailFallback(frame, image);
  });
}

function updateFeatured(episode) {
  if (!episode?.videoId) return;
  const video = document.querySelector("[data-featured-video]");
  video.setAttribute("data-title", episode.title);
  video.src = `https://www.youtube-nocookie.com/embed/${episode.videoId}?rel=0`;
  document.querySelector("[data-featured-title]").textContent = episode.title;
  document.querySelector("[data-featured-description]").textContent = excerpt(episode.deck || episode.description, 250) || "A featured conversation from The Alana Show.";
  const stats = [formatDate(episode.publishedAt), episode.viewCount ? `${compactNumber(episode.viewCount)} views` : ""].filter(Boolean);
  document.querySelector("[data-featured-stats]").textContent = stats.join(" · ");
}

function updateLatest(episode) {
  if (!episode?.videoId) return;
  const media = document.querySelector("[data-latest-media]");
  if (media) {
    media.innerHTML = EpisodeThumbnail({
      ...episode,
      thumbnail: isUsableThumbnailUrl(episode.thumbnail) ? episode.thumbnail : ""
    }, { latest: true });
    setupThumbnailFallbacks(media);
  }
  document.querySelector("[data-latest-title]").textContent = episode.title;
  document.querySelector("[data-latest-description]").textContent = excerpt(episode.deck || episode.description, 145) || "A verified conversation from The Alana Show archive.";
  document.querySelector("[data-latest-link]").href = `https://www.youtube.com/watch?v=${episode.videoId}`;
}

async function loadYouTube() {
  try {
    const data = await loadYouTubeFeed();
    const liveEpisodes = data.episodes?.length ? data.episodes : (data.recent || []);
    state.episodes = mergeEpisodeSources(liveEpisodes, editorialEpisodes).map(enrichEpisode);
    const featuredEpisode = state.episodes.find(episode => episode.videoId === FEATURED_CONVERSATION_VIDEO_ID)
      || editorialEpisodes.find(episode => episode.videoId === FEATURED_CONVERSATION_VIDEO_ID)
      || data.featured
      || data.mostWatched
      || data.latest;
    updateFeatured(featuredEpisode);
    const supportingEpisode = state.episodes.find(episode => episode.videoId !== featuredEpisode?.videoId) || data.latest;
    updateLatest(supportingEpisode);
    renderEpisodes(state.episodes);
    renderSearchResults("");
  } catch (error) {
    console.info("Using the verified static conversation archive while the live YouTube feed is unavailable.");
    state.episodes = mergeEpisodeSources(editorialEpisodes).map(enrichEpisode);
    const fallbackFeatured = state.episodes.find(episode => episode.videoId === FEATURED_CONVERSATION_VIDEO_ID) || state.episodes[0];
    const fallbackLatest = state.episodes.find(episode => episode.videoId !== fallbackFeatured?.videoId) || fallbackFeatured;
    updateFeatured(fallbackFeatured);
    updateLatest(fallbackLatest);
    renderEpisodes(state.episodes);
    renderSearchResults("");
  }
}

function searchResult(episode) {
  const youtubeUrl = `https://www.youtube.com/watch?v=${encodeURIComponent(episode.videoId)}`;
  const resultUrl = episode.detailPath || youtubeUrl;
  const external = !episode.detailPath;
  const categories = (episode.categories || []).slice(0, 3);
  const dateLabel = formatDate(episode.publishedAt) || "Verified conversation";
  const summary = excerpt(episode.deck || episode.description, 110) || "A verified conversation from The Alana Show archive.";
  return `<a class="search-result" href="${resultUrl}"${external ? ' target="_blank" rel="noopener"' : ""}>
    <span class="search-result-media">${EpisodeThumbnail(episode, { latest: false })}</span>
    <span><small>${escapeHtml(dateLabel)}</small><strong>${escapeHtml(episode.title)}</strong><p>${escapeHtml(summary)}</p>${categories.length ? `<span class="search-categories">${categories.map(category => `<span>${escapeHtml(category)}</span>`).join("")}</span>` : ""}</span>
    ${icon("arrow")}
  </a>`;
}

function renderSearchResults(query, category = state.selectedCategory) {
  const container = document.querySelector("[data-search-results]");
  const status = document.querySelector("[data-search-status]");
  if (!container) return 0;
  if (!state.episodes.length) {
    if (status) status.textContent = "The conversation archive is temporarily unavailable.";
    container.innerHTML = `<div class="search-empty"><p>The conversation archive is temporarily unavailable.</p><a href="${site.youtube}" target="_blank" rel="noopener">Visit The Alana Show on YouTube ${icon("arrow")}</a></div>`;
    return 0;
  }
  const matches = searchEpisodes(state.episodes, query, category);
  const description = category
    ? `${matches.length} conversation${matches.length === 1 ? "" : "s"} in ${category}.`
    : `${matches.length} conversation${matches.length === 1 ? "" : "s"} found.`;
  if (status) status.textContent = description;
  if ((query.trim() || category) && !matches.length) {
    const term = category || query;
    container.innerHTML = `<p class="search-empty">No conversations matched “${escapeHtml(term)}.” Try another guest, topic, or category.</p>`;
    return 0;
  }
  container.innerHTML = matches.map(searchResult).join("");
  setupThumbnailFallbacks(container);
  return matches.length;
}

function setupSearch() {
  const dialog = document.querySelector("[data-search-dialog]");
  const input = document.querySelector("[data-search-input]");
  let opener = null;
  let measureTimer = null;
  const open = event => {
    if (!dialog || !input || typeof dialog.showModal !== "function") return;
    opener = event?.currentTarget || document.activeElement;
    if (dialog.open) return;
    dialog.showModal();
    trackEvent("Search Open", { page: location.pathname });
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
  const chips = [...document.querySelectorAll("[data-search-chip]")];
  const selectCategory = category => {
    state.selectedCategory = category;
    chips.forEach(button => button.setAttribute("aria-pressed", String(button.dataset.searchChip === category)));
  };
  input?.addEventListener("input", () => {
    selectCategory("");
    const results = renderSearchResults(input.value, "");
    clearTimeout(measureTimer);
    if (input.value.trim() && state.episodes.length) {
      const queryLength = lengthBucket(input.value);
      measureTimer = setTimeout(() => {
        trackEvent("Search Query", { length: queryLength, results });
      }, 650);
    }
  });
  chips.forEach(button => button.addEventListener("click", () => {
    clearTimeout(measureTimer);
    const category = state.selectedCategory === button.dataset.searchChip ? "" : button.dataset.searchChip;
    selectCategory(category);
    input.value = "";
    const results = renderSearchResults("", category);
    trackEvent("Search Filter", { category: category || "all", results });
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
  const website = form?.elements.namedItem("website");
  if (!form) return;
  website?.addEventListener("input", () => website.setCustomValidity(""));
  form.addEventListener("submit", async event => {
    event.preventDefault();
    status.textContent = "";
    status.classList.remove("success");
    form.setAttribute("aria-busy", "false");
    if (website) {
      const websiteEntry = website.value;
      website.value = normalizeWebsiteOrSocial(websiteEntry);
      website.setCustomValidity(isValidWebsiteOrSocial(websiteEntry) ? "" : "Enter a valid website address or social username.");
    }
    if (!form.checkValidity()) {
      form.reportValidity();
      status.textContent = website?.validity.customError
        ? "Enter a valid website address or social username."
        : "Please complete the required fields.";
      trackEvent("Contact Form Invalid", { page: location.pathname });
      return;
    }
    const data = Object.fromEntries(new FormData(form).entries());
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
      trackEvent("Contact Form Success", { page: location.pathname });
    } catch (error) {
      status.textContent = "Your message could not be sent. Please email Alana@AlanaKVandeveer.com.";
      status.classList.remove("success");
      trackEvent("Contact Form Failure", { page: location.pathname });
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

setupNewsletter();
setupNavigation();
setupReveals();
setupBroadcastStatus();
setupInquiryLinks();
setupSearch();
setupContactForm();
setupYear();
setupThumbnailFallbacks();
loadYouTube();
