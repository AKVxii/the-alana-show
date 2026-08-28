import { MediaHeader, setupMediaNavigation } from "./components/MediaHeader.js";
import { Footer } from "./components/Footer.js";
import { BroadcastReach } from "./components/BroadcastReach.js";
import { isCurrentSpecialActive } from "./components/CurrentSpecial.js";
import { site } from "./data/site.js";
import { currentSpecial } from "./data/current-special.js";
import { topicHref } from "./data/topic-pages.js";
import { setupEditorialMotion } from "./lib/motion.js";

const pageKey = document.body.dataset.page;
const app = document.querySelector("#app");
const candidateSpecialActive = isCurrentSpecialActive(currentSpecial);

const external = (href, label, className = "button button-gold") => `<a class="${className}" href="${href}" target="_blank" rel="noopener">${label}</a>`;
const internal = (href, label, className = "button button-gold") => `<a class="${className}" href="${href}">${label}</a>`;
const contactHref = (inquiry, source) => `/?inquiry=${encodeURIComponent(inquiry)}&source=${encodeURIComponent(source)}#contact`;

const partnerContact = contactHref("Advertising or partnership", "advertise");
const guestContact = contactHref("Recommend a guest", "book");
const southFloridaContact = contactHref("General contact", "south-florida");
const onLocationContact = contactHref("On-location interview or event", "on-location");

const candidatePanel = candidateSpecialActive
  ? `<span class="growth-panel-kicker">2026 candidate?</span><strong>Candidate Interview Series</strong><p>${currentSpecial.urgencyText}</p><p class="growth-panel-note">${currentSpecial.disclaimer}</p>${external(currentSpecial.ctaHref, "Candidate Scheduling", "button button-light")}`
  : `<span class="growth-panel-kicker">Editorial review</span><strong>Pitch the conversation, not just the résumé.</strong><p>Guest inquiries are reviewed for subject matter, timing, relevance, and editorial fit.</p><p class="growth-panel-note">An inquiry does not guarantee an appearance.</p>${internal(guestContact, "Submit a Guest Inquiry", "button button-light")}`;

const specialsPage = candidateSpecialActive
  ? {
      eyebrow: "Focused series · timely conversations",
      title: "Specials",
      intro: "Focused interview series and editorial collections that make timely conversations easier to find, follow, and share.",
      featureEyebrow: currentSpecial.eyebrow,
      featureTitle: "2026 Candidates Special",
      featureCopy: "The 2026 Candidate Interview Series is now scheduling. Published candidate conversations will be collected here after the first verified interview is released.",
      panel: `<span class="growth-panel-kicker">Current special</span><strong>${currentSpecial.heading}</strong><p>${currentSpecial.urgencyText}</p><p class="growth-panel-note">${currentSpecial.disclaimer}</p>${external(currentSpecial.ctaHref, currentSpecial.ctaLabel, "button button-light")}`,
      exploreEyebrow: "Collections",
      exploreTitle: "Follow a focused series.",
      cardAction: "Explore",
      cards: [
        ["2026 Candidates Special", "Review the published package and request a candidate interview time.", "/candidates/"],
        ["Stepping Up", "Meet people who saw a need, took responsibility, and chose to make a difference.", topicHref("Stepping Up")],
        ["Community & Public Service", "Explore conversations centered on civic life, service, organizations, and local leadership.", "/topics/"]
      ],
      ctaEyebrow: "Explore more",
      ctaTitle: "Move from a special series into the full conversation archive.",
      ctas: `${internal("/topics/", "Browse Topics")}${internal("/episodes/", "All Conversations", "button button-ghost")}`
    }
  : {
      eyebrow: "Focused series · enduring conversations",
      title: "Specials",
      intro: "Editorial collections bring related conversations together so important subjects remain easy to find after the moment has passed.",
      featureEyebrow: "Editorial collections",
      featureTitle: "Focused conversations, organized with purpose.",
      featureCopy: "Alana — All Over the Place groups selected interviews around meaningful themes, communities, and recurring series without turning the archive into a maze.",
      panel: `<span class="growth-panel-kicker">Explore the archive</span><strong>Stories worth returning to.</strong><p>Special collections connect individual conversations to the larger subjects and communities around them.</p>${internal("/episodes/", "Browse Conversations", "button button-light")}`,
      exploreEyebrow: "Collections",
      exploreTitle: "Explore a collection.",
      cardAction: "View collection",
      cards: [
        ["Stepping Up", "Meet people who saw a need, took responsibility, and chose to make a difference.", topicHref("Stepping Up")],
        ["South Florida", "Explore conversations rooted in the people, organizations, and issues shaping the region.", "/south-florida/"],
        ["Topics", "Browse the archive through recurring subjects and ideas.", "/topics/"]
      ],
      ctaEyebrow: "Keep exploring",
      ctaTitle: "Find the next conversation by guest, topic, or idea.",
      ctas: `${internal("/episodes/", "Conversation Archive")}${internal("/guests/", "Browse Guests", "button button-ghost")}`
    };

const pages = {
  "south-florida": {
    eyebrow: "Local conversations · regional reach",
    title: "South Florida",
    intro: "Conversations rooted in South Florida, connecting local leadership, business, service, community, and ideas with listeners across the region.",
    featureEyebrow: "From the community outward",
    featureTitle: "Local voices. Wider conversation.",
    featureCopy: "Alana — All Over the Place brings together people shaping South Florida—from public service and entrepreneurship to community work, wellness, technology, and stories of people stepping up.",
    panel: `<span class="growth-panel-kicker">Heard on True Oldies</span><strong>South Florida</strong><p class="growth-panel-schedule">${site.broadcastSchedule}</p><p>${currentSpecial.broadcastText}</p><p class="growth-panel-note">${currentSpecial.reachText}</p>${external(site.trueOldies, "True Oldies Show Page", "button button-light")}`,
    exploreEyebrow: "Regional index",
    exploreTitle: "Explore conversations shaping the region.",
    cardAction: "Explore",
    cards: [
      ["Community", "Local voices, organizations, and people working to strengthen the places around them.", topicHref("Community")],
      ["Public Service", "Conversations about service, responsibility, public life, and the people doing the work.", topicHref("Public Service")],
      ["Business", "Entrepreneurship, ownership, innovation, growth, and the lessons behind building something that lasts.", topicHref("Business")]
    ],
    ctaEyebrow: "Have a South Florida story?",
    ctaTitle: "Bring a meaningful local conversation to the table.",
    ctas: `${internal("/book/", "Be a Guest")}${internal(southFloridaContact, "Recommend a Story", "button button-ghost")}`
  },
  specials: specialsPage,
  advertise: {
    eyebrow: "Partnerships · sponsorships · visibility",
    title: "Advertise & Partner",
    intro: "Explore clearly identified advertising and sponsorship opportunities across Alana — All Over the Place's radio, video, podcast, web, and conversation archive.",
    featureEyebrow: "Partnership opportunities",
    featureTitle: "Build around audience fit—not clutter.",
    featureCopy: "The strongest partnerships make sense beside the audience and subject matter. Sponsorship remains clearly identified, editorial independence stays intact, and opportunities can be shaped around recurring programming, individual conversations, regional visibility, or a relevant collection.",
    panel: `<span class="growth-panel-kicker">Regional broadcast</span><strong>True Oldies</strong><p class="growth-panel-schedule">${site.broadcastSchedule}</p><p>${currentSpecial.broadcastText}</p><p class="growth-panel-note">${currentSpecial.reachText}</p>${internal(partnerContact, "Start a Partnership Conversation", "button button-light")}`,
    exploreEyebrow: "Partnership structure",
    exploreTitle: "Partnership formats, clearly defined.",
    cardAction: "Discuss",
    cards: [
      ["Program & Conversation Sponsorship", "Discuss clearly identified brand visibility around recurring programming or a specific conversation.", partnerContact],
      ["Regional & Topic Alignment", "Explore sponsorship aligned with South Florida coverage or a subject-area collection where the fit is natural.", partnerContact],
      ["Custom Sponsorship Packages", "Discuss a clearly identified package around a relevant series, event, community initiative, or digital placement.", partnerContact]
    ],
    ctaEyebrow: "Built around fit",
    ctaTitle: "Tell us what you want to reach, support, or accomplish.",
    ctas: `${internal(partnerContact, "Advertising & Partnership Inquiry")}${internal("/south-florida/#broadcast-reach", "See South Florida Reach", "button button-ghost")}`
  },
  "on-location": {
    eyebrow: "Businesses · events · community · public affairs",
    title: "Alana — All Over the Place — On Location",
    intro: "Bring the conversation out of the studio and into the places where the story is actually happening.",
    featureEyebrow: "The show can come to you",
    featureTitle: "Your place. Your people. A real conversation on site.",
    featureCopy: "Selected interviews can be recorded at businesses, organizations, events, civic gatherings, and public-affairs settings, then produced for Alana — All Over the Place's radio, podcast, video, and web channels with the same editorial care as an in-studio conversation.",
    panel: `<span class="growth-panel-kicker">How it works</span><strong>Record on site. Produce for broadcast. Publish for replay.</strong><p>Tell us where the story is, who should be part of it, what viewers should understand, and the timing or event details.</p><p class="growth-panel-note">Editorial selection and scheduling apply. Political and public-affairs appearances do not imply endorsement.</p>${internal(onLocationContact, "Invite Alana — All Over the Place", "button button-light")}`,
    exploreEyebrow: "Go where the story is",
    exploreTitle: "A field format built for real places and real people.",
    cardAction: "Invite the show",
    cards: [
      ["Businesses & Organizations", "Invite the show into the places where work is actually done—from offices, restaurants, studios, shops, and workshops to nonprofits and community organizations.", onLocationContact],
      ["Events & Community", "Bring a conversation to openings, conferences, fundraisers, civic gatherings, cultural events, community initiatives, and other moments worth documenting.", onLocationContact],
      ["Public Affairs & Debates", "Request an on-location candidate, issue, public-policy, or moderated debate conversation. Editorial standards and independent selection remain in place.", onLocationContact]
    ],
    ctaEyebrow: "Have the show out",
    ctaTitle: "If the best place for the conversation is your place, tell us about it.",
    ctas: `${internal(onLocationContact, "Request an On-Location Conversation")}${internal("/standards/", "Editorial Standards", "button button-ghost")}`
  },
  book: {
    eyebrow: "Guest inquiries · story ideas · interviews",
    title: "Be a Guest",
    intro: "Have expertise, experience, a public-service story, a business journey, an artistic body of work, or a perspective worth exploring? Start the conversation here.",
    featureEyebrow: "A good interview starts before the microphone",
    featureTitle: "Bring a meaningful conversation to the table.",
    featureCopy: "The strongest guest pitches explain who you are, what you can add to the conversation, why the subject matters now, and where listeners can learn more about your work.",
    panel: candidatePanel,
    exploreEyebrow: "Editorial fit",
    exploreTitle: "What makes a strong guest inquiry.",
    cardAction: "Submit",
    cards: [
      ["Who Fits", "Leaders, entrepreneurs, public servants, artists, actors, musicians, advocates, experts, community builders, public figures, and people with stories worth hearing.", guestContact],
      ["What to Send", "Share the proposed topic, why it matters now, your background, and a website or social link that helps verify the story.", guestContact],
      ["What Happens Next", "Submissions are reviewed for editorial fit and availability. An inquiry does not guarantee an appearance.", guestContact]
    ],
    ctaEyebrow: "Ready to reach out?",
    ctaTitle: "Tell us the story you think Alana — All Over the Place should hear.",
    ctas: `${internal(guestContact, "Submit a Guest Inquiry")}${internal("/guests/", "Browse Past Guests", "button button-ghost")}`
  }
};

function card([title, copy, href], index, actionLabel = "Explore") {
  return `<a class="growth-card" href="${href}" data-reveal data-reveal-stagger="true" style="--growth-index:${index}"><span class="growth-card-number">0${index + 1}</span><h2>${title}</h2><p>${copy}</p><span class="growth-card-link">${actionLabel} <span aria-hidden="true">→</span></span></a>`;
}

const page = pages[pageKey] || pages["south-florida"];
const broadcastReachSection = pageKey === "south-florida"
  ? BroadcastReach()
  : pageKey === "advertise"
    ? BroadcastReach({ compact: true })
    : "";

app.innerHTML = `${MediaHeader()}<main id="main-content" class="growth-page growth-page-${pageKey}">
  <section class="media-hero growth-hero"><div class="shell media-hero-inner">
    <nav class="breadcrumbs" aria-label="Breadcrumb"><ol><li><a href="/">Home</a></li><li aria-current="page">${page.title}</li></ol></nav>
    <p class="eyebrow"><span></span> ${page.eyebrow}</p><h1>${page.title}</h1><p>${page.intro}</p>
  </div></section>

  <section class="growth-feature"><div class="shell growth-feature-grid">
    <div class="growth-feature-copy" data-reveal><p class="eyebrow dark"><span></span> ${page.featureEyebrow}</p><h2>${page.featureTitle}</h2><p>${page.featureCopy}</p></div>
    <aside class="growth-feature-panel" data-reveal>${page.panel}</aside>
  </div></section>

  ${broadcastReachSection}

  <section class="growth-explore"><div class="shell"><div class="growth-section-heading" data-reveal><p class="eyebrow dark"><span></span> ${page.exploreEyebrow}</p><h2>${page.exploreTitle}</h2></div><div class="growth-grid">${page.cards.map((item, index) => card(item, index, page.cardAction)).join("")}</div></div></section>

  <section class="growth-cta"><div class="shell growth-cta-inner" data-reveal><div><p class="eyebrow"><span></span> ${page.ctaEyebrow}</p><h2>${page.ctaTitle}</h2></div><div class="growth-cta-actions">${page.ctas}</div></div></section>
</main>${Footer({ fromSubpage: true })}`;

setupMediaNavigation();
setupEditorialMotion(app);
