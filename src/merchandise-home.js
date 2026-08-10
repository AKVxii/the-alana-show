import { Merchandise } from "./components/Merchandise.js";

const contact = document.querySelector("#contact");
if (contact && !document.querySelector(".merchandise-teaser")) {
  contact.insertAdjacentHTML("beforebegin", Merchandise());
}
