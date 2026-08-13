import { trackEvent } from "./measurement.js";

const ENGAGEMENT_GUARD = "__tasEpisodeEngagementBound";
const MILESTONES_SECONDS = [30, 120];
const TICK_MS = 5000;

function episodeSlug() {
  if (document.body.dataset.detailType !== "episode") return "";
  const fromDataset = String(document.body.dataset.detailId || "").trim();
  if (fromDataset) return fromDataset;
  const match = location.pathname.match(/^\/episodes\/([^/?#]+)/);
  return match?.[1] || "";
}

export function setupEpisodeEngagement() {
  if (typeof window === "undefined" || window[ENGAGEMENT_GUARD]) return;
  const episode = episodeSlug();
  if (!episode) return;

  window[ENGAGEMENT_GUARD] = true;
  let visibleMs = 0;
  let visibleSince = document.visibilityState === "visible" ? performance.now() : null;
  const fired = new Set();
  let timer = null;

  const stopIfComplete = () => {
    if (fired.size !== MILESTONES_SECONDS.length || timer === null) return;
    clearInterval(timer);
    timer = null;
    document.removeEventListener("visibilitychange", onVisibilityChange);
  };

  const recordMilestones = () => {
    const elapsedSeconds = Math.floor(visibleMs / 1000);
    for (const milestone of MILESTONES_SECONDS) {
      if (elapsedSeconds < milestone || fired.has(milestone)) continue;
      fired.add(milestone);
      trackEvent("Episode Engaged", {
        episode,
        milestone: `${milestone}s`
      });
    }
    stopIfComplete();
  };

  const accrueVisibleTime = () => {
    if (visibleSince === null) return;
    const now = performance.now();
    visibleMs += Math.max(0, now - visibleSince);
    visibleSince = now;
    recordMilestones();
  };

  function onVisibilityChange() {
    if (document.visibilityState === "visible") {
      visibleSince = performance.now();
      return;
    }
    accrueVisibleTime();
    visibleSince = null;
  }

  document.addEventListener("visibilitychange", onVisibilityChange);
  window.addEventListener("pagehide", accrueVisibleTime, { once: true });
  timer = window.setInterval(accrueVisibleTime, TICK_MS);
}
