import fs from "node:fs";

const read = path => fs.readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
const assert = (condition, message) => {
  if (!condition) throw new Error(message);
};

const index = read("index.html");
const briefPage = read("brief/index.html");
const briefComponent = read("src/components/BriefSignup.js");
const briefClient = read("src/lib/brief-signup.js");
const briefApi = read("api/brief.js");
const footer = read("src/components/Footer.js");
const sitemap = read("sitemap.xml");

assert(index.includes("/src/brief-home.js"), "Homepage must mount The Alana Brief signup experience.");
assert(index.includes("/src/brief.css"), "Homepage must load The Alana Brief design layer.");
assert(briefPage.includes('rel="canonical" href="https://thealanashow.com/brief"'), "Brief page must use the canonical production URL.");
assert(briefPage.includes('name="robots" content="index,follow,max-image-preview:large"'), "Brief page must remain crawlable.");
assert(briefComponent.includes("The conversations worth carrying forward."), "Brief signup must preserve the editorial positioning.");
assert(briefComponent.includes('name="email"'), "Brief signup must collect an email address.");
assert(briefClient.includes('fetch("/api/brief"'), "Brief form must submit through the server-side bridge.");
assert(briefApi.includes("process.env.KIT_API_KEY"), "Kit API key must remain server-side.");
assert(briefApi.includes("process.env.KIT_BRIEF_FORM_ID"), "Kit form ID must be configured server-side.");
assert(!briefComponent.includes("KIT_API_KEY"), "Kit credentials must never appear in client markup.");
assert(!briefClient.includes("KIT_API_KEY"), "Kit credentials must never appear in client JavaScript.");
assert(footer.includes('href="/brief/"'), "Sitewide footer must link to The Alana Brief.");
assert(sitemap.includes("https://thealanashow.com/brief"), "Sitemap must include The Alana Brief landing page.");

console.log("The Alana Brief gate passed.");
