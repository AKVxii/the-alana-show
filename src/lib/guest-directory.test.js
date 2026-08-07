import assert from "node:assert/strict";
import test from "node:test";
import { buildGuestDirectory, filterGuests, guestConversationPath, guestSurname } from "./guest-directory.js";
import { guestEpisodes, resolveCanonicalGuestName, searchEpisodes } from "./episode-search.js";

const archive = [
  { videoId: "one", title: "One", guestNames: ["Jane Doe", "John Public"] },
  { videoId: "two", title: "Two", guestNames: ["JANE Q. DOE"] },
  { videoId: "solo", title: "Alana K. Vandeveer on the show", guestNames: [] }
];
test("repeat and multi-guest appearances produce one canonical record", () => {
  const guests = buildGuestDirectory(archive);
  assert.deepEqual(guests.map(guest => guest.name), ["Jane Doe", "John Public"]);
  assert.equal(guests.find(guest => guest.name === "Jane Doe").conversationCount, 2);
});
test("curated records merge and remain available as offline fallback", () => {
  const curated = [{ id: "jane-doe", name: "Jane Doe", episodeIds: ["curated-one"] }];
  assert.equal(buildGuestDirectory([], curated)[0].conversationCount, 1);
  const merged = buildGuestDirectory(archive, curated).find(guest => guest.name === "Jane Doe");
  assert.equal(merged.id, "jane-doe"); assert.equal(merged.conversationCount, 2);
});
test("search and alphabet filtering find canonical names", () => {
  const guests = buildGuestDirectory(archive);
  assert.deepEqual(filterGuests(guests, "jane", "D").map(guest => guest.name), ["Jane Doe"]);
  assert.deepEqual(filterGuests(guests, "public", "P").map(guest => guest.name), ["John Public"]);
  assert.deepEqual(filterGuests(guests, "", "M"), []);
});

test("directory sorting and alphabet navigation use canonical surnames", () => {
  const guests = buildGuestDirectory([
    { videoId: "v", guestNames: ["Ashley Vertuno", "Sheriff Ric Bradshaw", "Nick Cannon", "Thais Glysson"] }
  ]);
  assert.deepEqual(guests.map(guest => guest.name), ["Sheriff Ric Bradshaw", "Nick Cannon", "Thais Glysson", "Ashley Vertuno"]);
  assert.deepEqual(filterGuests(guests, "", "B").map(guest => guest.name), ["Sheriff Ric Bradshaw"]);
  assert.equal(guestSurname("Dr. Jane Q. Public Jr."), "Public");
  assert.equal(guestSurname("Any Stage Name", "Mononym"), "Mononym");
});
test("links preserve static profiles and filter the archive for new guests", () => {
  assert.equal(guestConversationPath({ name: "Jane Doe", detailPath: "" }), "/episodes/?guest=Jane%20Doe");
  assert.equal(guestConversationPath({ name: "Michael Barnett", detailPath: "/guests/michael-barnett/" }), "/guests/michael-barnett/");
});
test("episode search returns repeat and multi-guest conversations", () => {
  assert.deepEqual(searchEpisodes(archive, "Jane Doe").map(item => item.videoId), ["one", "two"]);
  assert.deepEqual(searchEpisodes(archive, "John Public").map(item => item.videoId), ["one"]);
  assert.deepEqual(searchEpisodes(archive, "Alana K. Vandeveer"), []);
});

test("focused guest mode resolves only canonical guests and includes every appearance", () => {
  assert.equal(resolveCanonicalGuestName(archive, "Jane Doe"), "Jane Doe");
  assert.equal(resolveCanonicalGuestName(archive, "unrelated words"), "");
  assert.deepEqual(guestEpisodes(archive, "Jane Doe").map(item => item.videoId), ["one", "two"]);
});
