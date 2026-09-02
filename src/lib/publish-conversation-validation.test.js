import assert from "node:assert/strict";
import test from "node:test";

import { unverifiedEditorialCopyIssue } from "./publish-conversation-validation.js";

const meaningfulDescription = "Guest Name explains the operational decisions, public-service lessons, and community partnerships that shaped this verified conversation.";
const meaningfulDeck = "Guest Name shares practical leadership lessons and a factual perspective on the community work discussed in this episode.";

test("accepts explicit substantive offline publishing copy", () => {
  assert.equal(unverifiedEditorialCopyIssue({ description: meaningfulDescription, deck: meaningfulDeck }), "");
});

test("rejects missing or thin offline publishing copy", () => {
  assert.match(unverifiedEditorialCopyIssue({ deck: meaningfulDeck }), /description is required/);
  assert.match(unverifiedEditorialCopyIssue({ description: meaningfulDescription }), /deck is required/);
  assert.match(unverifiedEditorialCopyIssue({ description: "Brief summary", deck: meaningfulDeck }), /description must be specific/);
});

test("rejects generic boilerplate even when it is long enough", () => {
  const boilerplate = "Watch Alana — All Over the Place conversation with Guest Name for a featured conversation and more from Alana — All Over the Place.";
  assert.match(unverifiedEditorialCopyIssue({ description: boilerplate, deck: meaningfulDeck }), /must describe the verified people and substance/);
});
