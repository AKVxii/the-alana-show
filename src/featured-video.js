import { trackEvent } from "./lib/measurement.js";

const DEFAULT_TITLE = "Featured conversation from The Alana Show";

function escapeShadowText(value = "") {
  return String(value).replace(/[&<>"']/g, character => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  })[character]);
}

function videoIdFromEmbed(value = "") {
  try {
    const url = new URL(value, location.href);
    const match = url.pathname.match(/\/embed\/([A-Za-z0-9_-]{11})/);
    return match?.[1] || "";
  } catch {
    return "";
  }
}

function posterUrl(videoId, fallback = false) {
  if (!videoId) return "";
  return `https://i.ytimg.com/vi/${videoId}/${fallback ? "hqdefault" : "maxresdefault"}.jpg`;
}

class FeaturedVideo extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._src = "";
    this._playing = false;
  }

  connectedCallback() {
    if (!this._src) this.src = this.dataset.initialSrc || "";
    if (!this.shadowRoot.innerHTML) this.renderPoster();
  }

  get src() {
    return this._src;
  }

  set src(value) {
    const next = String(value || "").trim();
    if (!next || next === this._src) return;
    this._src = next;
    if (!this._playing && this.isConnected) this.renderPoster();
  }

  renderPoster() {
    const videoId = videoIdFromEmbed(this._src);
    const poster = posterUrl(videoId);
    const watchUrl = videoId ? `https://www.youtube.com/watch?v=${encodeURIComponent(videoId)}` : "https://www.youtube.com/@alanakvandeveer/videos";
    const title = this.getAttribute("data-title") || DEFAULT_TITLE;
    const isEpisode = this.dataset.context === "episode";
    const playLabel = isEpisode ? "Play this conversation" : "Play featured conversation";

    this.shadowRoot.innerHTML = `
      <style>
        :host { width: 100%; height: 100%; display: block; background: #030914; }
        .poster { width: 100%; height: 100%; padding: 0; position: relative; display: grid; place-items: center; overflow: hidden; color: #fff; border: 0; background: radial-gradient(circle at 62% 28%, #153354 0, #061020 44%, #030914 100%); cursor: pointer; }
        .poster::after { content: ""; position: absolute; inset: 0; background: linear-gradient(180deg, rgba(3,9,20,.08), rgba(3,9,20,.4)); pointer-events: none; }
        img { width: 100%; height: 100%; position: absolute; z-index: 1; inset: 0; object-fit: cover; }
        .fallback-brand { position: absolute; z-index: 0; inset: 0; display: grid; align-content: center; justify-items: center; gap: 10px; padding: clamp(26px, 6vw, 76px); text-align: center; transition: transform .2s ease; }
        .brand-mark { width: 42px; height: 42px; display: grid; place-items: center; color: #d8b866; border: 1px solid rgba(216,184,102,.7); border-radius: 50%; font: 700 .72rem/1 Georgia, "Times New Roman", serif; letter-spacing: .06em; }
        .show-name { color: #d8b866; font: 700 .68rem/1.2 ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; letter-spacing: .18em; text-transform: uppercase; }
        .fallback-brand strong { max-width: 26ch; color: #fff; font: 700 clamp(1.15rem, 3vw, 2.35rem)/1.08 Georgia, "Times New Roman", serif; text-wrap: balance; }
        .play { width: clamp(66px, 9vw, 88px); height: clamp(66px, 9vw, 88px); position: relative; z-index: 2; display: grid; place-items: center; border: 1px solid rgba(234,215,158,.8); border-radius: 50%; background: rgba(3,9,20,.8); box-shadow: 0 18px 45px rgba(3,9,20,.42), inset 0 0 0 5px rgba(216,184,102,.08); transition: transform .2s ease, background .2s ease, box-shadow .2s ease; }
        .play svg { width: 34%; margin-left: 5%; fill: #ead79e; filter: drop-shadow(0 2px 6px rgba(0,0,0,.28)); }
        .label { position: absolute; z-index: 2; left: 18px; bottom: 15px; padding: 7px 10px; color: #ead79e; border: 1px solid rgba(216,184,102,.3); border-radius: 999px; background: rgba(3,9,20,.76); font: 700 .67rem/1.2 ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; letter-spacing: .08em; text-transform: uppercase; backdrop-filter: blur(8px); }
        .poster:hover .play { transform: scale(1.05); background: rgba(6,16,32,.94); box-shadow: 0 22px 55px rgba(3,9,20,.5), 0 0 0 8px rgba(216,184,102,.08); }
        .poster.fallback-only .fallback-brand { transform: translateY(-13%); }
        .poster.fallback-only .play { position: absolute; left: 50%; top: 72%; transform: translate(-50%, -50%); }
        .poster.fallback-only:hover .play { transform: translate(-50%, -50%) scale(1.05); }
        .poster:focus-visible { outline: 3px solid #d8b866; outline-offset: -5px; }
        iframe { width: 100%; height: 100%; display: block; border: 0; }
        @media (prefers-reduced-motion: reduce) { .play { transition: none; } }
      </style>
      <button class="poster${poster ? "" : " fallback-only"}" type="button" aria-label="Play ${escapeShadowText(title)}">
        <span class="fallback-brand" aria-hidden="true"><span class="brand-mark">TAS</span><span class="show-name">The Alana Show</span><strong>${escapeShadowText(title)}</strong></span>
        ${poster ? `<img src="${poster}" alt="" loading="lazy" decoding="async">` : ""}
        <span class="play" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"></path></svg></span>
        <span class="label">${playLabel}</span>
      </button>
    `;

    const image = this.shadowRoot.querySelector("img");
    image?.addEventListener("error", () => {
      if (image.dataset.fallback !== "true" && videoId) {
        image.dataset.fallback = "true";
        image.src = posterUrl(videoId, true);
        return;
      }
      image.remove();
      this.shadowRoot.querySelector(".poster")?.classList.add("fallback-only");
    });

    this.shadowRoot.querySelector(".poster")?.addEventListener("click", () => this.play());
    this.dataset.watchUrl = watchUrl;
  }

  play() {
    if (this._playing || !this._src) return;
    this._playing = true;
    const separator = this._src.includes("?") ? "&" : "?";
    const iframe = document.createElement("iframe");
    iframe.src = `${this._src}${separator}autoplay=1`;
    iframe.title = this.getAttribute("data-title") || DEFAULT_TITLE;
    iframe.allow = "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share";
    iframe.referrerPolicy = "strict-origin-when-cross-origin";
    iframe.allowFullscreen = true;
    this.shadowRoot.innerHTML = "";
    this.shadowRoot.append(iframe);
    trackEvent("Featured Play", { location: this.dataset.context === "episode" ? "episode" : "home", platform: "youtube" });
  }
}

if (!customElements.get("featured-video")) {
  customElements.define("featured-video", FeaturedVideo);
}
