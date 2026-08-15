import fs from "node:fs";

const fail = message => {
  console.error(`ALP partner gate failed: ${message}`);
  process.exit(1);
};

const read = path => fs.readFileSync(path, "utf8");
for (const path of [
  "src/data/partners.js",
  "src/alp-partner.js",
  "src/alp-partner.css",
  "src/beyond-show-page.js",
  "beyond-the-show/index.html",
  "privacy/index.html"
]) {
  if (!fs.existsSync(path)) fail(`missing ${path}`);
}

const registry = read("src/data/partners.js");
const module = read("src/alp-partner.js");
const css = read("src/alp-partner.css");
const pageScript = read("src/beyond-show-page.js");
const page = read("beyond-the-show/index.html");
const privacy = read("privacy/index.html");

const warning = "WARNING: This product contains nicotine. Nicotine is an addictive chemical.";
if (!registry.includes(warning)) fail("required nicotine warning is missing from the partner registry");
if (!registry.includes('relationship: "Affiliate Partner"')) fail("ALP relationship must remain explicitly labeled Affiliate Partner");
if (!registry.includes("minimumAge: 21")) fail("ALP partner module must remain 21+ only");
if (!registry.includes('code: "10ALPOFF"')) fail("merchant-provided AvantLink offer code changed or is missing");
if (!registry.includes('customTrackingCode: "tas_beyond_alp_primary"')) fail("site placement tracking code changed or is missing");
if (!registry.includes('status: "pending-website-approval"')) fail("tracking status must remain pending until the website-specific AvantLink link is added");
if (!registry.includes('url: ""')) fail("ALP partner link must remain inactive until a website-specific AvantLink tracking URL is supplied");
if (!registry.includes("specificClickConsent: true")) fail("AvantLink tracking must require affirmative click consent");
if (!registry.includes("directClickOnly: true")) fail("AvantLink tracking must remain direct-click only");
if (!registry.includes("nonSolicitationOutsideNetwork: true")) fail("AvantLink merchant non-solicitation guardrail is missing");
if (!registry.includes("authorizedPromotionsOnly: true")) fail("authorized-promotion guardrail is missing");

if (!module.includes('rel="sponsored noopener"')) fail("future live affiliate link must use sponsored/noopener relationship attributes");
if (!module.includes("Affiliate disclosure:")) fail("FTC-style affiliate disclosure is missing near the partner placement");
if (!module.includes("MERCHANT-APPROVED AVANTLINK OFFER")) fail("merchant-authorized offer provenance is not surfaced");
if (!module.includes("Partner standard:")) fail("commercial/editorial relationship boundary is missing");
if (!module.includes("alp.offer.code") || !module.includes("const live = Boolean(alp.tracking.url)")) fail("offer code must only surface through the live-link branch");
if (!module.includes("data-affiliate-consent-open") || !module.includes("data-affiliate-consent-continue")) fail("affiliate tracking consent flow is missing");
if (!module.includes("No affiliate tracking click is sent unless you choose to continue")) fail("consent explanation must state that no tracking click is sent before consent");
if (!pageScript.includes('import "./alp-partner.js"')) fail("ALP partner module is not mounted on Beyond the Show");
if (!page.includes('id="partners"')) fail("Beyond the Show partner section is missing");

if (!css.includes("border:3mm solid #000")) fail("warning border must preserve the prominent FDA-style treatment");
if (!css.includes("min-height:150px") || !css.includes("min-height:560px")) fail("warning/ad proportions lost their prominent layout guardrail");
if (!css.includes("font-family:Arial,Helvetica,sans-serif")) fail("warning must remain in a conspicuous sans-serif treatment");
if (!css.includes("affiliate-consent-dialog")) fail("affiliate consent dialog styling is missing");

if (!privacy.includes('id="affiliate"')) fail("privacy notice must include an affiliate tracking section");
if (!privacy.includes("visitor must affirmatively choose to continue")) fail("privacy notice must describe affirmative affiliate tracking consent");
if (!privacy.includes("AvantLink")) fail("privacy notice must identify AvantLink");

const prohibitedClaims = [
  "safer than",
  "healthier than",
  "healthy nicotine",
  "quit smoking",
  "smoking cessation",
  "cessation aid",
  "therapeutic",
  "fda approved",
  "fda-approved"
];
const publicCopy = `${module}\n${page}`.toLowerCase();
for (const claim of prohibitedClaims) {
  if (publicCopy.includes(claim)) fail(`unsupported/prohibited claim detected: ${claim}`);
}

console.log("ALP partner gate passed.");
console.log("  21+ labeling, nicotine warning, affiliate disclosure, merchant-approved offer provenance, inactive tracking state, affirmative click consent, privacy disclosure, network guardrails, sponsored-link treatment, and claim restrictions: OK");
