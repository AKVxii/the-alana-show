import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { guestEpisodes, resolveCanonicalGuestName } from "./episode-search.js";

const episodes = [
  { videoId: "bradshaw", guestNames: ["Sheriff Ric Bradshaw"] },
  { videoId: "other", guestNames: ["Another Guest"] },
  { videoId: "bradshaw-two", guestNames: ["Ric Bradshaw"] }
];

test("a direct guest query resolves its canonical context and matching episodes", () => {
  assert.equal(resolveCanonicalGuestName(episodes, "Sheriff Ric Bradshaw"), "Sheriff Ric Bradshaw");
  assert.deepEqual(guestEpisodes(episodes, "Sheriff Ric Bradshaw").map(episode => episode.videoId), ["bradshaw", "bradshaw-two"]);
});

test("ordinary free text does not activate verified guest mode", () => {
  assert.equal(resolveCanonicalGuestName(episodes, "sheriff interview"), "");
});

test("episodes page places focused results before generic featured content and binds fallbacks", async () => {
  const source = await readFile(new URL("../episodes-page.js", import.meta.url), "utf8");
  assert.ok(source.indexOf("data-guest-results") < source.indexOf("data-generic-featured"));
  assert.match(source, /Conversations with \$\{state\.guestContext\}/);
  assert.match(source, /verified conversation/);
  assert.match(source, /bindThumbnailFallbacks\(grid\)/);
  assert.match(source, /bindThumbnailFallbacks\(node\)/);
  assert.match(source, /episodeThumbnailUrl\(episode\)/);
  assert.match(source, />View conversation<\/a>/);
});

test("clearing and browser navigation update focused mode", async () => {
  const source = await readFile(new URL("../episodes-page.js", import.meta.url), "utf8");
  assert.match(source, /state\.guestContext = ""/);
  assert.match(source, /window\.addEventListener\("popstate"/);
  assert.match(source, /renderGuestResults\(\); renderFeatured\(\)/);
});
