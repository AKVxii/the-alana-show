import { MediaHeader, setupMediaNavigation } from "./components/MediaHeader.js";
import { Footer } from "./components/Footer.js";

const header = document.querySelector("[data-press-header]");
const footer = document.querySelector("[data-press-footer]");

if (header) header.innerHTML = MediaHeader();
if (footer) footer.innerHTML = Footer({ fromSubpage: true });

setupMediaNavigation();
