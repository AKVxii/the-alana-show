import { MediaHeader, setupMediaNavigation } from "./components/MediaHeader.js";
import { Footer } from "./components/Footer.js";
import { BriefSignup } from "./components/BriefSignup.js";
import { setupBriefSignupForms } from "./lib/brief-signup.js";
import { setupEditorialMotion } from "./lib/motion.js";

const app = document.querySelector("#app");

app.innerHTML = `${MediaHeader()}
<main id="main-content" class="brief-page">
  <section class="brief-page-hero">
    <div class="shell">
      <nav class="breadcrumbs" aria-label="Breadcrumb"><ol><li><a href="/">Home</a></li><li aria-current="page">The Alana Brief</li></ol></nav>
      <p class="brief-page-mark">The Alana Brief</p>
      <h1>A thoughtful note between conversations.</h1>
      <p>New interviews, standout ideas, South Florida voices, and the conversations worth carrying forward — delivered directly from The Alana Show.</p>
    </div>
  </section>

  <section class="brief-value">
    <div class="shell">
      <div class="brief-value-heading" data-reveal>
        <p class="eyebrow dark"><span></span> Worth opening</p>
        <h2>More signal. Less inbox noise.</h2>
      </div>
      <div class="brief-value-grid">
        <article class="brief-value-card" data-reveal>
          <span>01</span>
          <h3>New conversations</h3>
          <p>Selected interviews and episodes, with enough context to know why the conversation is worth your time.</p>
        </article>
        <article class="brief-value-card" data-reveal>
          <span>02</span>
          <h3>Standout ideas</h3>
          <p>Useful observations, memorable moments, and thoughtful takeaways from leaders, builders, public servants, and community voices.</p>
        </article>
        <article class="brief-value-card" data-reveal>
          <span>03</span>
          <h3>What is next</h3>
          <p>Upcoming conversations, timely specials, South Florida notes, and occasional behind-the-scenes updates from the show.</p>
        </article>
      </div>
    </div>
  </section>

  ${BriefSignup({ source: "brief-page", compact: true })}
  <p class="brief-page-note">The Alana Brief is an editorial email from The Alana Show. Sponsorship, when present, will be clearly identified and will not determine editorial positions.</p>
</main>
${Footer({ fromSubpage: true })}`;

setupMediaNavigation();
setupEditorialMotion(app);
setupBriefSignupForms(app);
document.querySelectorAll("[data-year]").forEach(node => node.textContent = new Date().getFullYear());
