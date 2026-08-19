import { site } from "../data/site.js";
import { icon } from "../lib/icons.js";

export function Footer({ fromSubpage = false } = {}) {
  const home = fromSubpage ? "/" : "";
  return `
    <footer class="site-footer">
      <div class="shell footer-grid">
        <div class="footer-brand">
          <a class="brand" href="${home}#home">
            <span class="brand-seal" aria-hidden="true">TAS</span>
            <span class="brand-copy"><strong>The Alana Show</strong><span>Real conversations · Meaningful impact</span></span>
          </a>
          <p>A South Florida media platform built around preparation, curiosity, service, and conversations worth remembering.</p>
        </div>

        <div class="footer-links">
          <strong>Explore</strong>
          <a href="/episodes/">Episodes</a>
          <a href="/guests/">Guests</a>
          <a href="/topics/">Topics</a>
          <a href="/specials/">Specials</a>
          <a href="/candidates/">2026 Candidate Series</a>
          <a href="/south-florida/">South Florida</a>
          <a href="/merchandise/">Merchandise</a>
          <a href="/beyond-the-show/">Beyond the Show</a>
          <a href="${home}#listen">Listen</a>
          <a href="${home}#on-air">On Air</a>
        </div>

        <div class="footer-links">
          <strong>Connect</strong>
          <a href="/about/">About Alana</a>
          <a href="/book/">Be a Guest</a>
          <a href="/on-location/">Bring the Show to You</a>
          <a href="/advertise/">Advertise &amp; Partner</a>
          <a href="${home}#sponsor">Commercial Real Estate Sponsor — The Fitzgerald Group</a>
          <a href="${home}#contact">Contact</a>
          <a href="/press/">Press &amp; Media</a>
          <a href="/standards/">Editorial Standards</a>
          <a href="/privacy/">Privacy</a>
          <a href="/accessibility/">Accessibility</a>
          <a href="${site.social.instagram}" target="_blank" rel="noopener">Instagram</a>
          <a href="${site.social.x}" target="_blank" rel="noopener">X / Twitter</a>
          <a href="${site.social.linkedin}" target="_blank" rel="noopener">LinkedIn</a>
          <a href="mailto:${site.email}">${site.email}</a>
        </div>

        <div class="footer-heard">
          <span>Heard on</span>
          <strong>True Oldies</strong>
          <small>South Florida · ${site.broadcastSchedule}</small>
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
