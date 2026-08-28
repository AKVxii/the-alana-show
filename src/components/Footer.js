import { site } from "../data/site.js";
import { icon } from "../lib/icons.js";

export function Footer({ fromSubpage = false } = {}) {
  const home = fromSubpage ? "/" : "";
  return `
    <footer class="site-footer">
      <div class="shell footer-grid">
        <div class="footer-brand">
          <a class="brand" href="${home}#home">
            <span class="brand-seal" aria-hidden="true">AOP</span>
            <span class="brand-copy"><strong>Alana — All Over the Place</strong><span>Real conversations · Meaningful impact</span></span>
          </a>
          <p>A South Florida media platform built around preparation, curiosity, service, and conversations worth remembering.</p>
        </div>

        <div class="footer-links">
          <strong>Explore</strong>
          <a href="/episodes/">All Conversations</a>
          <a href="/about/">About Alana</a>
          <a href="/book/">Be a Guest</a>
          <a href="/advertise/">Advertise &amp; Partner</a>
          <a href="/merchandise/">Merchandise</a>
          <a href="${home}#contact">Contact</a>
        </div>

        <div class="footer-heard">
          <span>Heard on</span>
          <strong>True Oldies</strong>
          <small>South Florida · ${site.broadcastSchedule}</small>
          <a href="${site.trueOldies}" target="_blank" rel="noopener">Official show page ${icon("external")}</a>
        </div>
      </div>

      <div class="shell footer-bottom">
        <span>© <span data-year></span> Alana — All Over the Place / Alana K. Vandeveer. All rights reserved.</span>
        <span><a href="/standards/">Standards</a> · <a href="/privacy/">Privacy</a> · <a href="${site.social.instagram}" target="_blank" rel="noopener">Instagram</a></span>
      </div>
    </footer>
  `;
}
