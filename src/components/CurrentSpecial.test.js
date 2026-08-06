import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { CurrentSpecial, isCurrentSpecialActive } from "./CurrentSpecial.js";
import { currentSpecial } from "../data/current-special.js";

const today = new Date("2026-08-06T23:59:59-07:00");

test("current special renders exact configured copy, broadcast reach, and contact CTA", () => {
  const markup = CurrentSpecial(currentSpecial, today);
  for (const value of [
    currentSpecial.eyebrow, currentSpecial.heading, currentSpecial.copy,
    currentSpecial.broadcastText, currentSpecial.reachText,
    currentSpecial.urgencyText, currentSpecial.ctaLabel, currentSpecial.disclaimer
  ]) assert.ok(markup.includes(value));
  assert.match(markup, /href="\/#contact"/);
  assert.match(markup, /data-inquiry="Candidate Interview Series"/);
  assert.match(markup, /Limited Availability/);
  assert.match(markup, /current-special-broadcast/);
  assert.match(markup, /over 4 million people/);
  assert.match(markup, /95\.3, 95\.9, 96\.9 and 106\.9 FM/);
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

test("spotlight is integrated only between homepage platforms and episodes", async () => {
  const main = await readFile(new URL("../main.js", import.meta.url), "utf8");
  const detail = await readFile(new URL("../detail-page.js", import.meta.url), "utf8");
  const episodes = await readFile(new URL("../episodes-page.js", import.meta.url), "utf8");
  const guests = await readFile(new URL("../guests-page.js", import.meta.url), "utf8");
  assert.ok(main.indexOf("${Platforms()}") < main.indexOf("${CurrentSpecial()}"));
  assert.ok(main.indexOf("${CurrentSpecial()}") < main.indexOf("${Episodes()}"));
  for (const source of [detail, episodes, guests]) assert.doesNotMatch(source, /CurrentSpecial\(\)/);
});

test("existing contact form supports the spotlight inquiry context", async () => {
  const contact = await readFile(new URL("./Contact.js", import.meta.url), "utf8");
  const main = await readFile(new URL("../main.js", import.meta.url), "utf8");
  assert.match(contact, /<option>Candidate Interview Series<\/option>/);
  assert.match(main, /setupInquiryLinks\(\)/);
  assert.match(main, /setupContactForm\(\)/);
});
