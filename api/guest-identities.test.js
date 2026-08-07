const assert = require("node:assert/strict");
const test = require("node:test");
const { extractClearlyNamedGuests, guestIdentityByVideoId, identityKey, identifyEpisodeGuests, isClearlyHumanName } = require("./guest-identities");

test("the complete editorial mapping retains every currently curated exact video ID", () => {
  assert.deepEqual(guestIdentityByVideoId.kJWFTnWOgYM, ["Michael Barnett"]);
  assert.deepEqual(guestIdentityByVideoId["y5dQET3O1-c"], ["Jason Mandle", "Michael Barnett"]);
});
test("exact mappings override metadata and support multiple guests", () => {
  const result = identifyEpisodeGuests({ videoId: "y5dQET3O1-c", title: "with Incorrect Person", description: "Guest: Another Person" });
  assert.deepEqual(result.guestNames, ["Jason Mandle", "Michael Barnett"]);
  assert.equal(result.guestIdentitySource, "editorial");
});
test("conservative extraction accepts clearly labeled human guests", () => {
  assert.deepEqual(extractClearlyNamedGuests({ description: "Guest: Jane Doe and John Q. Public\nTopic: civic life" }), ["Jane Doe", "John Q. Public"]);
  assert.deepEqual(extractClearlyNamedGuests({ title: "A conversation with Jane Doe" }), ["Jane Doe"]);
});
test("host, organizations, offices, and topics are excluded", () => {
  for (const value of ["Alana K. Vandeveer", "Restoration Bridge International", "County Commission", "Battle Against Hunger"]) assert.equal(isClearlyHumanName(value), false, value);
  assert.deepEqual(extractClearlyNamedGuests({ description: "Guest: Alana K. Vandeveer\nGuest: Restoration Bridge International" }), []);
});
test("ambiguous cues are audited rather than guessed", () => {
  const result = identifyEpisodeGuests({ videoId: "ambiguous-id", title: "Leadership with community voices" });
  assert.deepEqual(result.guestNames, []);
  assert.deepEqual(result.unresolvedGuestAudit, { videoId: "ambiguous-id", title: "Leadership with community voices", reason: "Guest wording did not clearly identify a human name." });
});
test("identity keys normalize capitalization, punctuation, and honorifics", () => {
  assert.equal(identityKey("Dr. MICHAEL  BARNETT"), identityKey("Michael Barnett"));
});
