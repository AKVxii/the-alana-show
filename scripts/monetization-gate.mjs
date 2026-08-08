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
assert(growth.includes("Show & Episode Sponsorship"), "Advertise page must expose premium sponsorship formats.");
assert(growth.includes("South Florida & Topic Partnerships"), "Advertise page must expose regional/topic partnership inventory.");
assert(contact.includes('name="source"'), "Contact form must carry a non-personal inquiry source field.");
assert(context.includes('params.get("inquiry")'), "Contact context must preselect inquiry type from the URL.");
assert(context.includes('params.get("source")'), "Contact context must preserve the non-personal source label.");
assert(context.includes("alignContactSection"), "Contextual contact links must stabilize their landing position.");
assert(context.includes("window.scrollTo"), "Contact landing alignment must account for late layout shifts.");
assert(context.includes('root.style.scrollBehavior = "auto"'), "Contact deep-link correction must not visibly self-scroll.");
assert(api.includes("safeSource"), "Contact API must sanitize inquiry source context.");
assert(api.includes("Inquiry source:"), "Contact email must surface safe inquiry source context.");

console.log("Monetization conversion gate passed.");
