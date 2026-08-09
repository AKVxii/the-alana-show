import fs from "node:fs";

const read = path => fs.readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
const assert = (condition, message) => {
  if (!condition) throw new Error(message);
};

const growth = read("src/growth-page.js");
const contact = read("src/components/Contact.js");
const context = read("src/lib/contact-context.js");
const api = read("api/contact.js");

assert(growth.includes('contactHref("Advertising or partnership", "advertise")'), "Advertise page must preserve partnership inquiry context.");
assert(growth.includes("Program & Conversation Sponsorship"), "Advertise page must expose program/conversation sponsorship inventory.");
assert(growth.includes("Regional & Topic Alignment"), "Advertise page must expose regional/topic sponsorship inventory.");
assert(growth.includes("Custom Sponsorship Packages"), "Advertise page must expose a clearly identified custom sponsorship pathway.");
assert(growth.includes("Sponsorship remains clearly identified") && growth.includes("editorial independence stays intact"), "Advertise page must preserve clear sponsor identification and editorial independence.");
assert(contact.includes('name="source"'), "Contact form must carry a non-personal inquiry source field.");
assert(context.includes('params.get("inquiry")'), "Contact context must preselect inquiry type from the URL.");
assert(context.includes('params.get("source")'), "Contact context must preserve the non-personal source label.");
assert(context.includes("alignContactSection"), "Contextual contact links must stabilize their landing position.");
assert(context.includes("window.scrollTo"), "Contact landing alignment must account for late layout shifts.");
assert(context.includes('root.style.scrollBehavior = "auto"'), "Contact deep-link correction must not visibly self-scroll.");
assert(context.includes("projectedFormBottom"), "Contextual desktop inquiries must account for the form footer within the viewport.");
assert(context.includes("viewportFloor"), "Contextual desktop inquiries must preserve breathing room below the form.");
assert(context.includes("Math.min(overflow + 12, 56)"), "Contact viewport fitting must remain subtle and capped.");
assert(api.includes("safeSource"), "Contact API must sanitize inquiry source context.");
assert(api.includes("Inquiry source:"), "Contact email must surface safe inquiry source context.");

console.log("Monetization conversion gate passed.");
