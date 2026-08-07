import { MediaHeader, setupMediaNavigation } from "./components/MediaHeader.js";
import { Footer } from "./components/Footer.js";
import { site } from "./data/site.js";
import { currentSpecial } from "./data/current-special.js";
import { setupEditorialMotion } from "./lib/motion.js";

const pageKey = document.body.dataset.page;
const app = document.querySelector("#app");

const external = (href, label, className = "button button-gold") => `<a class="${className}" href="${href}" target="_blank" rel="noopener">${label}</a>`;
const internal = (href, label, className = "button button-gold") => `<a class="${className}" href="${href}">${label}</a>`;

const pages = {
  "south-florida": {
    eyebrow: "Local conversations · regional reach",
    title: "South Florida",
    intro: "Conversations rooted in South Florida, connecting local leadership, business, service, community, and ideas with listeners across the region.",
    featureEyebrow: "From the community outward",
    featureTitle: "Local voices. Wider conversation.",
    featureCopy: "The Alana Show brings together people shaping South Florida — from public service and entrepreneurship to community work, wellness, technology, and stories of people stepping up.",
    panel: `<span class="growth-panel-kicker">Heard on True Oldies</span><strong>South Florida &amp; the Treasure Coast</strong><p>${currentSpecial.broadcastText}</p><p class="growth-panel-note">${currentSpecial.reachText}</p>${external(site.trueOldies, "True Oldies Show Page", "button button-light")}`,
    cards: [
      ["Community", "Local voices, organizations, and people working to strengthen the places around them.", "/episodes/?topic=Community"],
      ["Public Service", "Conversations about service, responsibility, public life, and the people doing the work.", "/episodes/?topic=Public%20Service"],
      ["Business", "Entrepreneurship, ownership, innovation, growth, and the lessons behind building something that lasts.", "/episodes/?topic=Business"]
    ],
    ctaEyebrow: "Have a South Florida story?",
    ctaTitle: "Bring a meaningful local conversation to the table.",
    ctas: `${internal("/book/", "Be a Guest")}${internal("/#contact", "Recommend a Story", "button button-ghost")}`
  },
  specials: {
    eyebrow: "Focused series · timely conversations",
    title: "Specials",
    intro: "Focused interview series and editorial collections that make timely conversations easier to find, follow, and share.",
    featureEyebrow: currentSpecial.eyebrow,
    featureTitle: "2026 Candidates Special",
    featureCopy: "Verified candidate interviews are collected in one place so listeners can hear candidates discuss their background, priorities, and vision in their own words.",
    panel: `<span class="growth-panel-kicker">Current special</span><strong>${currentSpecial.heading}</strong><p>${currentSpecial.urgencyText}</p><p class="growth-panel-note">${currentSpecial.disclaimer}</p>${external(currentSpecial.ctaHref, currentSpecial.ctaLabel, "button button-light")}`,
    cards: [
      ["2026 Candidates Special", "Browse the current verified candidate interview collection.", "/episodes/?topic=2026%20Candidates%20Special"],
      ["Stepping Up", "Meet people who saw a need, took responsibility, and chose to make a difference.", "/episodes/?topic=Stepping%20Up"],
      ["Community & Public Service", "Explore conversations centered on civic life, service, organizations, and local leadership.", "/topics/"]
    ],
    ctaEyebrow: "Explore more",
    ctaTitle: "Move from a special series into the full conversation archive.",
    ctas: `${internal("/topics/", "Browse Topics")}${internal("/episodes/", "All Episodes", "button button-ghost")}`
  },
  advertise: {
    eyebrow: "Partnerships · sponsorships · visibility",
    title: "Advertise & Partner",
    intro: "Connect your organization with a thoughtful interview platform spanning radio, podcast, video, and the web.",
    featureEyebrow: "Partnership opportunities",
    featureTitle: "Support conversations people choose to spend time with.",
    featureCopy: "Partnerships are built around fit, audience relevance, and clear separation between editorial conversations and paid promotion. Opportunities can be discussed across on-air, website, and digital distribution, subject to availability.",
    panel: `<span class="growth-panel-kicker">Regional broadcast</span><strong>True Oldies</strong><p>${currentSpecial.broadcastText}</p><p class="growth-panel-note">${currentSpecial.reachText}</p>${internal("/#contact", "Start a Partnership Conversation", "button button-light")}`,
    cards: [
      ["Show Sponsorship", "Discuss brand visibility around The Alana Show and its recurring programming.", "/#contact"],
      ["Digital & Website", "Explore placements and integrations connected to the show website and digital audience journey.", "/#contact"],
      ["Custom Partnerships", "Build a thoughtful package around a relevant series, community initiative, event, or campaign.", "/#contact"]
    ],
    ctaEyebrow: "Built around fit",
    ctaTitle: "Tell us what you are trying to reach, support, or accomplish.",
    ctas: `${internal("/#contact", "Advertising Inquiry")}${internal("/south-florida/", "See South Florida Reach", "button button-ghost")}`
  },
  book: {
    eyebrow: "Guest inquiries · story ideas · interviews",
    title: "Be a Guest",
    intro: "Have expertise, experience, a public-service story, a business journey, or a perspective worth exploring? Start the conversation here.",
    featureEyebrow: "A good interview starts before the microphone",
    featureTitle: "Bring a meaningful conversation to the table.",
    featureCopy: "The strongest guest pitches explain who you are, what you can add to the conversation, why the subject matters now, and where listeners can learn more about your work.",
    panel: `<span class="growth-panel-kicker">2026 candidate?</span><strong>Candidate Interview Series</strong><p>${currentSpecial.urgencyText}</p><p class="growth-panel-note">${currentSpecial.disclaimer}</p>${external(currentSpecial.ctaHref, "Candidate Scheduling", "button button-light")}`,
    cards: [
      ["Who Fits", "Leaders, entrepreneurs, public servants, advocates, experts, community builders, and people with stories worth hearing.", "/#contact"],
      ["What to Send", "Share the proposed topic, why it matters now, your background, and a website or social link that helps verify the story.", "/#contact"],
      ["What Happens Next", "Submissions are reviewed for editorial fit and availability. An inquiry does not guarantee an appearance.", "/#contact"]
    ],
    ctaEyebrow: "Ready to reach out?",
    ctaTitle: "Tell us the story you think The Alana Show should hear.",
    ctas: `${internal("/#contact", "Submit a Guest Inquiry")}${internal("/guests/", "Browse Past Guests", "button button-ghost")}`
  }
};

function card([title, copy, href], index) {
  return `<a class="growth-card" href="${href}" data-reveal data-reveal-stagger="true" style="--growth-index:${index}"><span class="growth-card-number">0${index + 1}</span><h2>${title}</h2><p>${copy}</p><span class="growth-card-link">Explore <span aria-hidden="true">→</span></span></a>`;
}

const page = pages[pageKey] || pages["south-florida"];
app.innerHTML = `${MediaHeader()}<main id="main-content">
  <section class="media-hero growth-hero"><div class="growth-orbit growth-orbit-one" aria-hidden="true"></div><div class="growth-orbit growth-orbit-two" aria-hidden="true"></div><div class="shell media-hero-inner">
    <nav class="breadcrumbs" aria-label="Breadcrumb"><ol><li><a href="/">Home</a></li><li aria-current="page">${page.title}</li></ol></nav>
    <p class="eyebrow"><span></span> ${page.eyebrow}</p><h1>${page.title}</h1><p>${page.intro}</p>
  </div></section>

  <section class="growth-feature"><div class="shell growth-feature-grid">
    <div class="growth-feature-copy" data-reveal><p class="eyebrow dark"><span></span> ${page.featureEyebrow}</p><h2>${page.featureTitle}</h2><p>${page.featureCopy}</p></div>
    <aside class="growth-feature-panel" data-reveal>${page.panel}</aside>
  </div></section>

  <section class="growth-explore"><div class="shell"><div class="growth-section-heading" data-reveal><p class="eyebrow dark"><span></span> Explore</p><h2>Go deeper without digging.</h2></div><div class="growth-grid">${page.cards.map(card).join("")}</div></div></section>

  <section class="growth-cta"><div class="shell growth-cta-inner" data-reveal><div><p class="eyebrow"><span></span> ${page.ctaEyebrow}</p><h2>${page.ctaTitle}</h2></div><div class="growth-cta-actions">${page.ctas}</div></div></section>
</main>${Footer({ fromSubpage: true })}`;

setupMediaNavigation();
setupEditorialMotion(app);
