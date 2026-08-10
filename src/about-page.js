import { MediaHeader, setupMediaNavigation } from "./components/MediaHeader.js";
import { Footer } from "./components/Footer.js";

const header = document.querySelector("[data-about-header]");
const footer = document.querySelector("[data-about-footer]");

if (header) header.innerHTML = MediaHeader();
if (footer) footer.innerHTML = Footer({ fromSubpage: true });

setupMediaNavigation();
