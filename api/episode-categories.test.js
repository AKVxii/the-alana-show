const assert = require("assert");
const {
  CATEGORY_NAMES,
  CATEGORY_OVERRIDES,
  categorizeEpisode
} = require("./episode-categories");

function categories(episode) {
  return categorizeEpisode(episode).categories;
}

function hasExactly(actual, expected) {
  assert.deepStrictEqual([...actual].sort(), [...expected].sort());
  assert.strictEqual(new Set(actual).size, actual.length);
  assert(actual.length <= 3);
}

hasExactly(categories({
  title: "Inside the County Sheriff's Office: Leadership and Public Service"
}), ["Community", "Leadership", "Public Service"]);

hasExactly(categories({
  title: "Supporting Florida Veterans",
  description: "A conversation substantially featuring Wounded Veterans Relief Fund."
}), ["Stepping Up", "Community", "Public Service"]);

hasExactly(categories({
  title: "Restoration Bridge International",
  description: "Food rescue and community relief."
}), ["Stepping Up", "Community"]);

hasExactly(categories({
  title: "Restoration Bridge International",
  description: "A faith-based ministry focused on food rescue and community relief."
}), ["Stepping Up", "Community", "Faith & Purpose"]);

for (const title of ["We Fund the Blue", "MACA Community Service"]) {
  hasExactly(categories({ title }), ["Stepping Up", "Community", "Public Service"]);
}

// Curated sheriff matching is title-only: a passing description mention must
// not add the sheriff-specific Community + Leadership + Public Service set.
assert(!categories({
  title: "An unrelated business conversation",
  description: "The guest briefly thanked the sheriff before discussing marketing."
}).includes("Leadership"));

for (const episode of [
  { title: "A bridge to business growth" },
  { title: "A blue-sky technology discussion" },
  { title: "A veteran entrepreneur", description: "Business ownership." },
  { title: "A community conversation", description: "A general discussion." }
]) {
  const actual = categories(episode);
  assert(actual.length < 3, `${episode.title} incorrectly received a curated three-category override`);
}

hasExactly(categories({ title: "Senjutsu Martial Arts Academy" }), ["Wellness", "Leadership"]);
assert(categories({ title: "Cybercrime and Fraud" }).includes("Technology"));
hasExactly(categories({
  title: "Purpose-Driven Leadership with Ashley Vertuno, FACHE"
}), ["Leadership", "Wellness"]);
hasExactly(categories({ title: "Michael Barnett Election Conversation" }), ["Public Service", "Leadership"]);
assert(categories({ title: "Community nonprofit food rescue" }).includes("Stepping Up"));

CATEGORY_OVERRIDES.fixtureVideoId = ["Business", "Leadership"];
hasExactly(categories({ videoId: "fixtureVideoId", title: "A reviewed episode" }), ["Business", "Leadership"]);
delete CATEGORY_OVERRIDES.fixtureVideoId;

assert.deepStrictEqual(categories({ title: "An ambiguous conversation" }), []);
assert.deepStrictEqual(categories({}), []);
assert.deepStrictEqual(CATEGORY_NAMES, [
  "Leadership", "Community", "Business", "Public Service",
  "Faith & Purpose", "Wellness", "Technology", "Stepping Up"
]);

console.log("PASS curated category corrections and regression cases");
