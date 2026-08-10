import { MediaHeader, setupMediaNavigation } from "./components/MediaHeader.js";
import { Footer } from "./components/Footer.js";

const header = document.querySelector("[data-trust-header]");
const footer = document.querySelector("[data-trust-footer]");

if (header) header.innerHTML = MediaHeader();
if (footer) footer.innerHTML = Footer({ fromSubpage: true });

setupMediaNavigation();
