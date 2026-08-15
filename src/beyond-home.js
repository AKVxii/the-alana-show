import { BeyondShow } from "./components/BeyondShow.js";

if (!document.querySelector("[data-beyond-home]")) {
  const contact = document.querySelector("#contact");
  if (contact) contact.insertAdjacentHTML("beforebegin", BeyondShow());
}
