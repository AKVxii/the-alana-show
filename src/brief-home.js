import { BriefSignup } from "./components/BriefSignup.js";
import { setupBriefSignupForms } from "./lib/brief-signup.js";

function mountBrief() {
  if (document.querySelector("[data-home-brief]")) return;
  const about = document.querySelector("#about");
  if (!about) return;

  const wrapper = document.createElement("div");
  wrapper.dataset.homeBrief = "true";
  wrapper.innerHTML = BriefSignup({ source: "homepage" });
  about.insertAdjacentElement("afterend", wrapper);
  setupBriefSignupForms(wrapper);
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => requestAnimationFrame(mountBrief), { once: true });
} else {
  requestAnimationFrame(mountBrief);
}
