import { trackEvent } from "./measurement.js";

const SHARE_GUARD = "__tasConversationShareBound";

function episodeShareUrl() {
  const canonical = document.querySelector('link[rel="canonical"]')?.href || location.href;
  const rawStart = new URLSearchParams(location.search).get("t");
  if (!rawStart || !/^\d+$/.test(rawStart)) return canonical;

  const seconds = Number(rawStart);
  if (!Number.isSafeInteger(seconds) || seconds <= 0) return canonical;

  const url = new URL(canonical);
  url.searchParams.set("t", String(Math.min(seconds, 86400)));
  return url.href;
}

async function copyText(value) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(value);
    return;
  }

  const textarea = document.createElement("textarea");
  textarea.value = value;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.opacity = "0";
  document.body.append(textarea);
  textarea.select();
  const copied = document.execCommand("copy");
  textarea.remove();
  if (!copied) throw new Error("Copy unavailable");
}

function temporaryLabel(button, label) {
  const original = button.textContent;
  button.textContent = label;
  window.setTimeout(() => {
    if (button.isConnected) button.textContent = original;
  }, 2200);
}

export function setupConversationShare() {
  if (document.body.dataset.detailType !== "episode" || window[SHARE_GUARD]) return;

  const actions = document.querySelector("[data-episode-primary-actions]");
  const heading = document.querySelector("#episode-title");
  if (!actions || !heading) return;

  window[SHARE_GUARD] = true;
  const button = document.createElement("button");
  button.type = "button";
  button.className = "button button-outline";
  button.dataset.shareConversation = "true";
  button.textContent = "Share conversation";
  actions.append(button);

  button.addEventListener("click", async () => {
    const title = heading.textContent?.trim() || "The Alana Show conversation";
    const url = episodeShareUrl();

    if (navigator.share) {
      try {
        await navigator.share({
          title: `${title} | The Alana Show`,
          text: `Watch ${title} on The Alana Show.`,
          url
        });
        trackEvent("Conversation Share", { method: "native", page: location.pathname });
        return;
      } catch (error) {
        if (error?.name === "AbortError") return;
      }
    }

    try {
      await copyText(url);
      temporaryLabel(button, "Link copied");
      trackEvent("Conversation Share", { method: "copy", page: location.pathname });
    } catch {
      temporaryLabel(button, "Use Share by email");
      trackEvent("Conversation Share", { method: "unavailable", page: location.pathname });
    }
  });
}
