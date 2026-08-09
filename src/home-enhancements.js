import { BroadcastReach } from "./components/BroadcastReach.js";
import { Newsletter, setupNewsletter } from "./newsletter.js";
import { setupEditorialMotion } from "./lib/motion.js";

function insertAfter(node, html) {
  if (!node) return null;
  node.insertAdjacentHTML("afterend", html);
  return node.nextElementSibling;
}

function mountHomepageEnhancements() {
  if (!document.querySelector("#on-air")) {
    const listen = document.querySelector("#listen");
    const broadcast = insertAfter(listen, BroadcastReach());
    if (broadcast) setupEditorialMotion(broadcast);
  }

  if (!document.querySelector("#updates")) {
    const partner = document.querySelector("#partner");
    const newsletter = insertAfter(partner, Newsletter());
    if (newsletter) setupEditorialMotion(newsletter);
  }

  setupNewsletter();
}

mountHomepageEnhancements();
