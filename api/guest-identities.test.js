const assert = require("node:assert/strict");
const test = require("node:test");
const {
  extractClearlyNamedGuests,
  guestIdentityByVideoId,
  identityKey,
  identifyEpisodeGuests,
  isClearlyHumanName,
  unresolvedGuestByVideoId
} = require("./guest-identities");

test("the complete archive mapping covers all verified guest conversations", () => {
  assert.equal(Object.keys(guestIdentityByVideoId).length, 26);
  const distinctGuests = new Set(Object.values(guestIdentityByVideoId).flat());
  assert.equal(distinctGuests.size, 30);
  assert.deepEqual(guestIdentityByVideoId["NN9mSARhmIQ"], ["Gillian Lieberman", "Scott Diament"]);
  assert.deepEqual(guestIdentityByVideoId["Kx7rcDzaqDk"], ["George LeMieux"]);
  assert.deepEqual(guestIdentityByVideoId["VYXrV-WGiHM"], ["George LeMieux"]);
  assert.deepEqual(guestIdentityByVideoId["7hGs2kuAKMk"], [
    "Noel J. Guillama-Alvarez",
    "Michael Castellano",
    "Mark Khachaturian"
  ]);
  assert.deepEqual(guestIdentityByVideoId["y5dQET3O1-c"], ["Jason Mandle", "Michael Barnett"]);
});

test("the current George LeMieux master resolves to the canonical guest profile", () => {
  const result = identifyEpisodeGuests({
    videoId: "Kx7rcDzaqDk",
    title: "Former U.S. Senator George LeMieux | Leadership, Public Service & Florida’s Future",
    description: ""
  });
  assert.deepEqual(result.guestNames, ["George LeMieux"]);
  assert.deepEqual(result.guestIds, ["george-lemieux"]);
  assert.equal(result.guestIdentitySource, "editorial");
  assert.equal(result.unresolvedGuestAudit, null);
});

test("exact mappings override metadata and support multiple guests", () => {
  const result = identifyEpisodeGuests({
    videoId: "y5dQET3O1-c",
    title: "with Incorrect Person",
    description: "Guest: Another Person"
  });
  assert.deepEqual(result.guestNames, ["Jason Mandle", "Michael Barnett"]);
  assert.equal(result.guestIdentitySource, "editorial");
});

test("repeat appearances remain linked to one canonical person", () => {
  const appearances = Object.values(guestIdentityByVideoId).flat();
  assert.equal(appearances.filter(name => name === "Michael Castellano").length, 3);
  assert.equal(appearances.filter(name => name === "Michael Barnett").length, 2);
  assert.equal(appearances.filter(name => name === "Matthew Yeandle").length, 2);
  assert.equal(appearances.filter(name => name === "John Rourke").length, 2);
});

test("conservative extraction accepts clearly labeled human guests", () => {
  assert.deepEqual(
    extractClearlyNamedGuests({ description: "Guest: Jane Doe and John Q. Public\nTopic: civic life" }),
    ["Jane Doe", "John Q. Public"]
  );
  assert.deepEqual(extractClearlyNamedGuests({ title: "A conversation with Jane Doe" }), ["Jane Doe"]);
});

test("host, organizations, offices, and topics are excluded", () => {
  for (const value of [
    "Alana K. Vandeveer",
    "Restoration Bridge International",
    "County Commission",
    "Battle Against Hunger"
  ]) {
    assert.equal(isClearlyHumanName(value), false, value);
  }
  assert.deepEqual(
    extractClearlyNamedGuests({
      description: "Guest: Alana K. Vandeveer\nGuest: Restoration Bridge International"
    }),
    []
  );
});

test("the incomplete Tommy identity is explicitly unresolved", () => {
  const result = identifyEpisodeGuests({
    videoId: "yyaqtWiOH9s",
    title: unresolvedGuestByVideoId.yyaqtWiOH9s.title,
    description: "Interview with Tommy of MSCS Media."
  });
  assert.deepEqual(result.guestNames, []);
  assert.deepEqual(result.unresolvedGuestAudit, unresolvedGuestByVideoId.yyaqtWiOH9s);
});

test("ambiguous cues are audited rather than guessed", () => {
  const result = identifyEpisodeGuests({
    videoId: "ambiguous-id",
    title: "Leadership with community voices"
  });
  assert.deepEqual(result.guestNames, []);
  assert.deepEqual(result.unresolvedGuestAudit, {
    videoId: "ambiguous-id",
    title: "Leadership with community voices",
    reason: "Guest wording did not clearly identify a human name."
  });
});

test("identity keys normalize capitalization, punctuation, and honorifics", () => {
  assert.equal(identityKey("Dr. MICHAEL  BARNETT"), identityKey("Michael Barnett"));
  assert.equal(identityKey("Sheriff Ric Bradshaw"), identityKey("Ric Bradshaw"));
});
