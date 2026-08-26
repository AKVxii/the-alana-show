import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { CurrentSpecial, isCurrentSpecialActive } from "./CurrentSpecial.js";
import { currentSpecial } from "../data/current-special.js";

const today = new Date("2026-08-06T23:59:59-07:00");

test("current special renders the verified broad broadcast line and candidate-details CTA", () => {
  const markup = CurrentSpecial(currentSpecial, today);
  for (const value of [
    currentSpecial.eyebrow, currentSpecial.heading, currentSpecial.copy,
    currentSpecial.broadcastText, currentSpecial.reachText,
    currentSpecial.urgencyText, currentSpecial.ctaLabel
  ]) assert.ok(markup.includes(value));
  assert.match(markup, /href="\/candidates"/);
  assert.doesNotMatch(markup, /target="_blank"/);
  assert.match(markup, /data-inquiry="Candidate Interview Series"/);
  assert.match(markup, /Limited Availability/);
  assert.match(markup, /current-special-broadcast/);
  assert.match(markup, /Tuesdays on True Oldies across South Florida, with worldwide streaming and video\./);
  assert.match(markup, /No payment is collected through Calendly\./);
  assert.match(markup, /Alana K\. Vandeveer&#039;s W-9 and written payment instructions/);
  assert.match(markup, /Payment is due at booking!/);
  assert.doesNotMatch(markup, /over 4 million people|South and Central Florida|Miami-Dade|Broward|Orlando/i);
});

test("internal reusable CTA can still use the existing inquiry flow", () => {
  const markup = CurrentSpecial({
    ...currentSpecial,
    ctaHref: "/#contact",
    ctaExternal: false
  }, today);
  assert.match(markup, /href="\/#contact"/);
  assert.match(markup, /data-inquiry="Candidate Interview Series"/);
  assert.doesNotMatch(markup, /target="_blank"/);
});

test("broadcast details remain optional for future reusable specials", () => {
  const markup = CurrentSpecial({ ...currentSpecial, broadcastText: null, reachText: null }, today);
  assert.doesNotMatch(markup, /current-special-broadcast/);
});

test("disabled and out-of-window specials leave no markup", () => {
  assert.equal(CurrentSpecial({ ...currentSpecial, enabled: false }, today), "");
  assert.equal(CurrentSpecial({ ...currentSpecial, startDate: "2026-08-08" }, today), "");
  assert.equal(CurrentSpecial({ ...currentSpecial, endDate: "2026-08-06" }, today), "");
});

test("null dates are active and date-only bounds use UTC calendar dates", () => {
  assert.equal(isCurrentSpecialActive({ ...currentSpecial, startDate: null, endDate: null }, today), true);
  assert.equal(isCurrentSpecialActive({ ...currentSpecial, startDate: "2026-08-07", endDate: "2026-08-07" }, today), true);
});

test("homepage uses one clear three-path gateway before the LeMieux-led watch section", async () => {
  const main = await readFile(new URL("../main.js", import.meta.url), "utf8");
  const detail = await readFile(new URL("../detail-page.js", import.meta.url), "utf8");
  const episodes = await readFile(new URL("../episodes-page.js", import.meta.url), "utf8");
  const guests = await readFile(new URL("../guests-page.js", import.meta.url), "utf8");
  assert.ok(main.indexOf("${Hero()}") < main.indexOf("${Conversions()}"));
  assert.ok(main.indexOf("${Conversions()}") < main.indexOf("${Episodes()}"));
  assert.ok(main.indexOf("${Episodes()}") < main.indexOf("${Platforms()}"));
  assert.doesNotMatch(main, /CurrentSpecial\(\)/);
  for (const source of [detail, episodes, guests]) assert.doesNotMatch(source, /CurrentSpecial\(\)/);
});

test("existing contact form still supports the Candidate Interview Series context", async () => {
  const contact = await readFile(new URL("./Contact.js", import.meta.url), "utf8");
  const main = await readFile(new URL("../main.js", import.meta.url), "utf8");
  assert.match(contact, /<option>Candidate Interview Series<\/option>/);
  assert.match(main, /setupInquiryLinks\(\)/);
  assert.match(main, /setupContactForm\(\)/);
});
