import { BeyondShow } from "./components/BeyondShow.js";
import { setupEditorialMotion } from "./lib/motion.js";

if (!document.querySelector('link[data-beyond-show-styles]')) {
  const stylesheet = document.createElement("link");
  stylesheet.rel = "stylesheet";
  stylesheet.href = "/src/beyond-show.css?v=1";
  stylesheet.dataset.beyondShowStyles = "true";
  document.head.append(stylesheet);
}

if (!document.querySelector("[data-beyond-home]")) {
  const contact = document.querySelector("#contact");
  if (contact) {
    contact.insertAdjacentHTML("beforebegin", BeyondShow());
    const beyondHome = document.querySelector("[data-beyond-home]");
    if (beyondHome) setupEditorialMotion(beyondHome);
  }
}
