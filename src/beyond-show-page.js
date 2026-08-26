import { MediaHeader, setupMediaNavigation } from "./components/MediaHeader.js";
import { Footer } from "./components/Footer.js";
import "./alp-partner.js?v=20260826-alp-placeholder-removal";

const header = document.querySelector("[data-beyond-header]");
const footer = document.querySelector("[data-beyond-footer]");

if (header) header.innerHTML = MediaHeader();
if (footer) footer.innerHTML = Footer({ fromSubpage: true });
setupMediaNavigation();
