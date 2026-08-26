import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const failures = [];
const fail = message => failures.push(message);
const read = relative => fs.readFileSync(path.join(ROOT, relative), "utf8");

const pages = [
  {
    id: "standards",
    title: "Editorial Standards",
    required: [
      "Sponsorship and editorial independence",
      "Candidate and public-service conversations",
      "does not by itself constitute an endorsement",
      "Corrections and feedback"
    ]
  },
  {
    id: "privacy",
    title: "Privacy",
    required: [
      "Information submitted through the website is not sold",
      "Vercel",
      "Resend",
      "Kit",
      "YouTube / Google",
      "Google Analytics",
      "visitor chooses “Allow analytics.”",
      "does not send names, email addresses, phone numbers, messages, website/social fields, or raw search text",
      "No advertising pixel by default",
      "data-reset-analytics-consent"
    ]
  },
  {
    id: "accessibility",
    title: "Accessibility",
    required: [
      "WCAG 2.2 Level AA principles",
      "not a claim of independent certification",
      "Skip links",
      "Reduced-motion",
      "Report an accessibility problem"
    ]
  }
];

const sitemap = read("sitemap.xml");
const footer = read("src/components/Footer.js");

for (const page of pages) {
  const relative = `${page.id}/index.html`;
  if (!fs.existsSync(path.join(ROOT, relative))) {
    fail(`Missing trust page: ${relative}`);
    continue;
  }

  const html = read(relative);
  const canonical = `https://thealanashow.com/${page.id}`;

  for (const needle of [
    `<title>${page.title}`,
    `<link rel="canonical" href="${canonical}">`,
    'meta name="robots" content="index,follow,max-image-preview:large"',
    'type="application/ld+json"',
    'class="skip-link"',
    'id="main-content"',
    'data-trust-header',
    'data-trust-footer',
    '/src/trust-pages.css',
    '/src/trust-page.js'
  ]) {
    if (!html.includes(needle)) fail(`${relative} is missing required trust-page markup: ${needle}`);
  }

  for (const needle of page.required) {
    if (!html.includes(needle)) fail(`${relative} is missing required disclosure text: ${needle}`);
  }

  if (!sitemap.includes(`<loc>${canonical}</loc>`)) fail(`${canonical} is missing from sitemap.xml.`);
  if (!footer.includes(`href="/${page.id}"`)) fail(`${page.title} is missing from the shared footer.`);
}

const trustScript = read("src/trust-page.js");
if (!trustScript.includes("MediaHeader") || !trustScript.includes("Footer({ fromSubpage: true })")) {
  fail("Trust pages must keep the shared site header and footer shell.");
}

const privacy = read("privacy/index.html");
if (/we (?:guarantee|promise) (?:complete|absolute) security/i.test(privacy)) {
  fail("Privacy notice must not promise absolute security.");
}
if (/does not run Google Analytics/i.test(privacy)) {
  fail("Privacy notice must not make the obsolete claim that Google Analytics can never run; optional analytics is now consent-gated when configured.");
}
if (!privacy.includes("Optional Google Analytics measurement is consent-gated")) {
  fail("Privacy notice must state that optional Google Analytics measurement is consent-gated.");
}

const accessibility = read("accessibility/index.html");
if (/certified (?:wcag|accessible)|fully compliant/i.test(accessibility)) {
  fail("Accessibility statement must not make an unsupported certification/compliance claim.");
}

if (failures.length) {
  console.error("Publisher trust gate failed:");
  failures.forEach(message => console.error(`- ${message}`));
  process.exit(1);
}

console.log("Publisher trust gate passed.");
console.log("  Editorial standards, privacy transparency, consent-gated measurement disclosure, accessibility statement, footer discovery, and sitemap coverage: OK");
