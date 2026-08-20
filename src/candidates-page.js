import { MediaHeader, setupMediaNavigation } from "./components/MediaHeader.js";
import { Footer } from "./components/Footer.js";
import { site } from "./data/site.js";
import { setupEditorialMotion } from "./lib/motion.js";

const app = document.querySelector("#app");
const bookingUrl = "https://calendly.com/alana-alanakvandeveer/2026-candidate-interview";

const packageItems = [
  ["Studio Interview", "A professionally recorded 30-minute in-studio video and audio conversation with Alana K. Vandeveer."],
  ["Radio Broadcast", "Broadcast placement and airtime are confirmed separately. The Alana Show currently airs Tuesdays on True Oldies across South Florida."],
  ["Digital Distribution", "After production, the conversation is prepared for The Alana Show's video, podcast, and web channels."]
];

const distributionLabels = ["True Oldies", "South Florida", "Worldwide streaming", "Full video"];

app.innerHTML = `${MediaHeader()}
<main id="main-content" class="candidate-page">
  <section class="candidate-hero">
    <div class="shell candidate-hero-grid">
      <div class="candidate-hero-copy" data-reveal>
        <nav class="breadcrumbs" aria-label="Breadcrumb"><ol><li><a href="/">Home</a></li><li aria-current="page">2026 Candidates</li></ol></nav>
        <p class="eyebrow"><span></span> 2026 Candidate Interview Series</p>
        <h1>Your background. Your priorities. In your own words.</h1>
        <p class="candidate-lead">The Alana Show warmly welcomes legally qualified candidates to a thoughtful, professionally produced 30-minute conversation about the communities they seek to serve.</p>
        <div class="candidate-hero-actions">
          <a class="button button-gold" href="${bookingUrl}" target="_blank" rel="noopener">Request an Interview Time — $1,500</a>
          <a class="button button-ghost" href="#candidate-process">How Confirmation Works</a>
        </div>
        <p class="candidate-small-note">A Calendly selection is a tentative studio hold. No payment is collected through Calendly. After requesting a time, the campaign receives The Alana Show's W-9 and written payment instructions. The required payment confirmation must be completed by the stated deadline or the hold is released. Broadcast placement and airtime are confirmed separately.</p>
      </div>

      <aside class="candidate-package-card" data-reveal>
        <span class="candidate-card-kicker">Candidate Media Package</span>
        <div class="candidate-price">$1,500</div>
        <p>One professionally produced interview package, offered on the same published terms to legally qualified candidates.</p>
        <dl>
          <div><dt>Recording</dt><dd>30 minutes · in studio</dd></div>
          <div><dt>Broadcast</dt><dd>Placement confirmed separately</dd></div>
          <div><dt>Distribution</dt><dd>Radio · video · podcast · digital</dd></div>
          <div><dt>Confirmation</dt><dd>Written payment confirmation required</dd></div>
        </dl>
        <a class="candidate-text-link" href="${bookingUrl}" target="_blank" rel="noopener">View available recording times <span aria-hidden="true">→</span></a>
      </aside>
    </div>
  </section>

  <section class="candidate-stat-band" aria-label="Candidate interview package">
    <div class="shell candidate-stat-grid">
      <div><strong>30</strong><span>Minute interview</span></div>
      <div><strong>Studio</strong><span>Video + audio</span></div>
      <div><strong>Radio</strong><span>Placement confirmed separately</span></div>
      <div><strong>Digital</strong><span>Video · podcast · web</span></div>
    </div>
  </section>

  <section class="candidate-section candidate-package-section">
    <div class="shell">
      <div class="candidate-section-heading" data-reveal>
        <p class="eyebrow dark"><span></span> The package</p>
        <h2>A complete interview, built to travel.</h2>
        <p>The conversation is produced once and prepared to reach listeners and viewers across broadcast and digital channels.</p>
      </div>
      <div class="candidate-card-grid">
        ${packageItems.map(([title, copy], index) => `<article class="candidate-info-card" data-reveal style="--candidate-index:${index}"><span>0${index + 1}</span><h3>${title}</h3><p>${copy}</p></article>`).join("")}
      </div>
    </div>
  </section>

  <section class="candidate-section candidate-footprint-section">
    <div class="shell candidate-footprint-grid">
      <div data-reveal>
        <p class="eyebrow"><span></span> Broadcast &amp; digital</p>
        <h2>One conversation, prepared for radio and digital.</h2>
        <p>${site.broadcast.summary} Candidate interview broadcast placement and airtime are confirmed separately.</p>
        <div class="candidate-stations" aria-label="Distribution channels">${distributionLabels.map(name => `<span>${name}</span>`).join("")}</div>
      </div>
      <aside class="candidate-footprint-card" data-reveal>
        <span class="candidate-card-kicker">Current show schedule</span>
        <strong>Tuesdays</strong>
        <p>${site.broadcastSchedule} on True Oldies. ${site.broadcast.availabilityNote} Candidate interview dates and times are confirmed separately.</p>
        <a class="candidate-text-link candidate-text-link-light" href="${site.trueOldies}" target="_blank" rel="noopener">The Alana Show on True Oldies <span aria-hidden="true">→</span></a>
      </aside>
    </div>
  </section>

  <section class="candidate-section candidate-process-section" id="candidate-process">
    <div class="shell">
      <div class="candidate-section-heading" data-reveal>
        <p class="eyebrow dark"><span></span> What to expect</p>
        <h2>Clear from request to confirmation.</h2>
      </div>
      <ol class="candidate-process">
        <li data-reveal><span>01</span><div><h3>Request a studio time</h3><p>Select an available time through Calendly. The selection is a tentative hold, not a confirmed appointment. No payment is collected through Calendly.</p></div></li>
        <li data-reveal><span>02</span><div><h3>Complete confirmation</h3><p>After requesting a time, the campaign receives The Alana Show's W-9 and written payment instructions. Complete the required payment confirmation by the stated deadline or the tentative hold is released.</p></div></li>
        <li data-reveal><span>03</span><div><h3>Prepare, record &amp; publish</h3><p>After confirmation, studio directions and preparation details are provided. Broadcast placement and airtime are confirmed separately, followed by planned publication through The Alana Show's digital channels.</p></div></li>
      </ol>
    </div>
  </section>

  <section class="candidate-section candidate-standards-section">
    <div class="shell candidate-standards-grid">
      <div data-reveal>
        <p class="eyebrow dark"><span></span> Equal terms · independent conversation</p>
        <h2>A professional invitation to candidates across the ballot.</h2>
      </div>
      <div class="candidate-standards-copy" data-reveal>
        <p>Participation is available to legally qualified candidates on the same published package price and core terms. An appearance does not constitute an endorsement by The Alana Show, Alana K. Vandeveer, or participating broadcast outlets.</p>
        <p>Campaigns remain responsible for their own reporting and compliance obligations. After a time is requested, the campaign receives The Alana Show's W-9 and written payment instructions. The required payment confirmation must be completed by the stated deadline or the hold is released. Scheduling and placement remain subject to studio availability, participating-station policies, and applicable legal requirements.</p>
        <a class="candidate-text-link" href="/standards/">Read The Alana Show editorial standards <span aria-hidden="true">→</span></a>
      </div>
    </div>
  </section>

  <section class="candidate-section candidate-archive-section">
    <div class="shell candidate-archive-panel" data-reveal>
      <div>
        <p class="eyebrow"><span></span> Candidate conversations</p>
        <h2>Published interviews will be collected here.</h2>
        <p>Candidate conversations will appear in The Alana Show archive after the first verified interview is released. Until then, this page provides package terms and scheduling information only.</p>
      </div>
      <span class="candidate-small-note" data-candidate-archive-status="pending">No verified 2026 candidate interview has been published yet.</span>
    </div>
  </section>

  <section class="candidate-final-cta">
    <div class="shell candidate-final-cta-inner" data-reveal>
      <div>
        <p class="eyebrow"><span></span> Candidate scheduling</p>
        <h2>Ready to join the conversation?</h2>
        <p>Request an available studio time. The campaign then receives The Alana Show's W-9 and written payment instructions; required payment confirmation is due by the stated deadline.</p>
      </div>
      <div class="candidate-final-actions">
        <a class="button button-gold" href="${bookingUrl}" target="_blank" rel="noopener">Request Your Candidate Interview</a>
        <a class="candidate-contact-link" href="tel:+15614447700">Questions? 561-444-7700</a>
      </div>
    </div>
  </section>
</main>
${Footer({ fromSubpage: true })}`;

setupMediaNavigation();
setupEditorialMotion(app);
