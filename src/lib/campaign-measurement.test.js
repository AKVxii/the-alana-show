import assert from "node:assert/strict";
import test from "node:test";

import { campaignAttribution } from "./campaign-measurement.js";

test("campaign attribution preserves only approved source and campaign values", () => {
  assert.deepEqual(
    campaignAttribution("?utm_source=radio&utm_medium=broadcast&utm_campaign=george_lemieux_episode"),
    { source: "radio", campaign: "george_lemieux_episode" }
  );
});

test("campaign attribution fails closed for unapproved values", () => {
  assert.deepEqual(
    campaignAttribution("?utm_source=someone%40example.com&utm_campaign=private-message"),
    { source: "other", campaign: "other" }
  );
});

test("campaign attribution ignores ordinary page queries", () => {
  assert.equal(campaignAttribution("?t=1669"), null);
  assert.equal(campaignAttribution(""), null);
});
