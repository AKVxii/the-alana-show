import { MediaHeader, setupMediaNavigation } from "./components/MediaHeader.js";
import { Footer } from "./components/Footer.js";
import { site } from "./data/site.js";
import { setupEditorialMotion } from "./lib/motion.js";

const app = document.querySelector("#app");
const bookingUrl = "https://calendly.com/alana-alanakvandeveer/2026-candidate-interview";
const candidateArchive = "/episodes/?topic=2026%20Candidates%20Special";

const packageItems = [
  ["Studio Interview", "A professionally recorded 30-minute in-studio video and audio conversation with Alana K. Vandeveer."],
  ["Radio Broadcast", "Tuesday evening broadcast placement across five station brands and 16 signals serving communities from Broward County through Orlando."],
  ["Digital Distribution", "Publication through The Alana Show's digital channels so the conversation remains available beyond the original broadcast."],
  ["Campaign Assets", "Professionally edited clips and promotional assets prepared for the campaign's own use and sharing."]
];

const stationBrands = ["Treasure Coast Talk Radio", "Space Coast Talk Radio", "Mega 107.1", "The Surf", "True Oldies Channel"];

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
          <a class="button button-gold" href="${bookingUrl}" target="_blank" rel="noopener">Reserve Your Interview — $1,500</a>
          <a class="button button-ghost" href="${candidateArchive}">View Candidate Conversations</a>
        </div>
        <p class="candidate-small-note">The time selected through Calendly is the studio recording appointment. Broadcast date and air time are confirmed separately.</p>
      </div>

      <aside class="candidate-package-card" data-reveal>
        <span class="candidate-card-kicker">Candidate Media Package</span>
        <div class="candidate-price">$1,500</div>
        <p>One professionally produced interview package, offered on the same published terms to legally qualified candidates.</p>
        <dl>
          <div><dt>Recording</dt><dd>30 minutes · in studio</dd></div>
          <div><dt>Broadcast</dt><dd>Tuesday evening · 8:00 or 8:30 PM</dd></div>
          <div><dt>Distribution</dt><dd>Radio · video · podcast · digital</dd></div>
          <div><dt>Payment</dt><dd>Collected securely at booking</dd></div>
        </dl>
        <a class="candidate-text-link" href="${bookingUrl}" target="_blank" rel="noopener">View available recording times <span aria-hidden="true">→</span></a>
      </aside>
    </div>
  </section>

  <section class="candidate-stat-band" aria-label="Candidate interview reach">
    <div class="shell candidate-stat-grid">
      <div><strong>30</strong><span>Minute interview</span></div>
      <div><strong>5</strong><span>Station brands</span></div>
      <div><strong>16</strong><span>Signals on the dial</span></div>
      <div><strong>Broward → Orlando</strong><span>South &amp; Central Florida reach</span></div>
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
        <p class="eyebrow"><span></span> Broadcast footprint</p>
        <h2>One conversation. A wider Florida audience.</h2>
        <p>The 2026 candidate package is distributed across a five-brand, 16-signal radio footprint extending from Broward County north through Orlando, alongside The Alana Show's digital distribution.</p>
        <div class="candidate-stations" aria-label="Station brands">${stationBrands.map(name => `<span>${name}</span>`).join("")}</div>
      </div>
      <aside class="candidate-footprint-card" data-reveal>
        <span class="candidate-card-kicker">On air</span>
        <strong>Tuesday evenings</strong>
        <p>Candidate interviews are scheduled for an 8:00 or 8:30 p.m. broadcast slot. Same-race candidates are offered comparable placement where practicable.</p>
        <a class="candidate-text-link candidate-text-link-light" href="${site.trueOldies}" target="_blank" rel="noopener">The Alana Show on True Oldies <span aria-hidden="true">→</span></a>
      </aside>
    </div>
  </section>

  <section class="candidate-section candidate-process-section">
    <div class="shell">
      <div class="candidate-section-heading" data-reveal>
        <p class="eyebrow dark"><span></span> What to expect</p>
        <h2>Simple from booking to broadcast.</h2>
      </div>
      <ol class="candidate-process">
        <li data-reveal><span>01</span><div><h3>Reserve &amp; pay</h3><p>Select a studio recording time through Calendly and complete the $1,500 payment at booking.</p></div></li>
        <li data-reveal><span>02</span><div><h3>Prepare &amp; record</h3><p>Studio directions, arrival instructions, and interview preparation details are provided before recording. Please plan to arrive 15 minutes early.</p></div></li>
        <li data-reveal><span>03</span><div><h3>Broadcast &amp; publish</h3><p>Your Tuesday broadcast date and air time are confirmed separately, followed by digital publication and campaign-ready promotional assets.</p></div></li>
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
        <p>Campaigns remain responsible for their own reporting and compliance obligations. A W-9 is available to the campaign treasurer for recordkeeping. Availability is based on studio scheduling and remaining broadcast inventory.</p>
        <a class="candidate-text-link" href="/standards/">Read The Alana Show editorial standards <span aria-hidden="true">→</span></a>
      </div>
    </div>
  </section>

  <section class="candidate-section candidate-archive-section">
    <div class="shell candidate-archive-panel" data-reveal>
      <div>
        <p class="eyebrow"><span></span> Published conversations</p>
        <h2>Follow the 2026 Candidate Interview Series.</h2>
        <p>As candidate conversations publish, they are collected together in The Alana Show archive for viewers, listeners, campaigns, and voters to revisit and share.</p>
      </div>
      <a class="button button-light" href="${candidateArchive}">View the Candidate Series</a>
    </div>
  </section>

  <section class="candidate-final-cta">
    <div class="shell candidate-final-cta-inner" data-reveal>
      <div>
        <p class="eyebrow"><span></span> Candidate scheduling</p>
        <h2>Ready to join the conversation?</h2>
        <p>Choose an available studio time and complete your reservation in one step.</p>
      </div>
      <div class="candidate-final-actions">
        <a class="button button-gold" href="${bookingUrl}" target="_blank" rel="noopener">Book Your Candidate Interview</a>
        <a class="candidate-contact-link" href="tel:+15614447700">Questions? 561-444-7700</a>
      </div>
    </div>
  </section>
</main>
${Footer({ fromSubpage: true })}`;

setupMediaNavigation();
setupEditorialMotion(app);
