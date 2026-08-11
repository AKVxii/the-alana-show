import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const failures = [];
const read = relative => fs.readFileSync(path.join(ROOT, relative), "utf8");
const expect = (condition, message) => { if (!condition) failures.push(message); };

const pagePath = "on-location/index.html";
expect(fs.existsSync(path.join(ROOT, pagePath)), "Missing /on-location static page.");

if (fs.existsSync(path.join(ROOT, pagePath))) {
  const page = read(pagePath);
  expect(page.includes('rel="canonical" href="https://thealanashow.com/on-location"'), "On-location page canonical is missing or incorrect.");
  expect(page.includes('data-page="on-location"'), "On-location page is not wired to growth-page rendering.");
  expect(page.includes('name="description"'), "On-location page needs a meta description.");
}

const growth = read("src/growth-page.js");
expect(growth.includes('"on-location": {'), "Growth-page configuration is missing the on-location page.");
expect(growth.includes('On-location interview or event'), "On-location CTA does not carry the dedicated inquiry type.");
expect(growth.includes('Political and public-affairs appearances do not imply endorsement.'), "On-location public-affairs neutrality note is missing.");

const partner = read("src/components/Partner.js");
expect(partner.includes('href="/on-location/"'), "Homepage partnership section does not surface the on-location page.");

const contact = read("src/components/Contact.js");
expect(contact.includes('<option>On-location interview or event</option>'), "Contact form is missing the on-location inquiry option.");
expect(contact.includes('tel:+15614447700'), "Direct show phone contact is missing.");

const api = read("api/contact.js");
expect(api.includes('"On-location interview or event"'), "Contact API does not allow the on-location inquiry type.");

const footer = read("src/components/Footer.js");
expect(footer.includes('href="/on-location/"'), "Footer does not link to the on-location page.");

const sitemap = read("sitemap.xml");
expect(sitemap.includes('<loc>https://thealanashow.com/on-location</loc>'), "Sitemap is missing the on-location page.");

if (failures.length) {
  console.error("On-location gate failed:");
  failures.forEach(message => console.error(`- ${message}`));
  process.exit(1);
}

console.log("On-location gate passed: landing page, inquiry path, discovery links, neutrality note, phone contact, and sitemap are aligned.");
