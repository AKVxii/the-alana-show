import { site } from "../data/site.js";
import { icon } from "../lib/icons.js";

export function Footer() {
  return `
    <footer class="site-footer">
      <div class="shell footer-grid">
        <div class="footer-brand">
          <a class="brand" href="#home">
            <span class="brand-seal" aria-hidden="true">TAS</span>
            <span class="brand-copy"><strong>The Alana Show</strong><span>Real conversations · Meaningful impact</span></span>
          </a>
          <p>A South Florida media platform built around preparation, curiosity, service, and conversations worth remembering.</p>
        </div>

        <div class="footer-links">
          <strong>Explore</strong>
          <a href="#watch">Watch</a>
          <a href="#listen">Listen</a>
          <a href="#on-air">On Air</a>
          <a href="#impact">Stepping Up</a>
        </div>

        <div class="footer-links">
          <strong>Connect</strong>
          <a href="#about">About Alana</a>
          <a href="#partner">Advertise &amp; Partner</a>
          <a href="#contact">Contact</a>
          <a href="${site.social.instagram}" target="_blank" rel="noopener">Instagram</a>
          <a href="${site.social.x}" target="_blank" rel="noopener">X / Twitter</a>
          <a href="${site.social.linkedin}" target="_blank" rel="noopener">LinkedIn</a>
          <a href="mailto:${site.email}">${site.email}</a>
        </div>

        <div class="footer-heard">
          <span>Heard on</span>
          <strong>True Oldies</strong>
          <small>South Florida · Tuesdays at 8 PM ET</small>
          <a href="${site.trueOldies}" target="_blank" rel="noopener">Official show page ${icon("external")}</a>
        </div>
      </div>

      <div class="shell footer-bottom">
        <span>© <span data-year></span> The Alana Show / Alana K. Vandeveer. All rights reserved.</span>
        <span>Editorial independence · Purposeful storytelling · Community impact</span>
      </div>
    </footer>
  `;
}
