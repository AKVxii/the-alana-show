import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { episodeById, episodes, guests } from "./catalog.js";
import { searchEpisodes } from "../lib/episode-search.js";

test("verified guest relationships stay unique and complete", () => {
  assert.equal(new Set(guests.map(guest => guest.id)).size, guests.length);

  const michaelBarnett = guests.find(guest => guest.id === "michael-barnett");
  const jasonMandle = guests.find(guest => guest.id === "jason-mandle");

  assert.equal(michaelBarnett.episodeIds.length, 2);
  assert.equal(jasonMandle.episodeIds.length, 1);
  assert.ok(michaelBarnett.episodeIds.every(episodeById));
  assert.ok(jasonMandle.episodeIds.every(episodeById));
});

test("verified guest searches return only their related catalog episodes", () => {
  assert.deepEqual(
    searchEpisodes(episodes, "Michael Barnett").map(episode => episode.videoId),
    ["kJWFTnWOgYM", "y5dQET3O1-c"]
  );
  assert.deepEqual(
    searchEpisodes(episodes, "Jason Mandle").map(episode => episode.videoId),
    ["y5dQET3O1-c"]
  );
});

test("guest directory links route to guest profiles instead of the first episode", () => {
  const source = readFileSync(new URL("../guests-page.js", import.meta.url), "utf8");

  assert.match(source, /const guestPath = `\/guests\/\$\{guest\.id\}\//);
  assert.match(source, /<h3><a href="\$\{guestPath\}">/);
  assert.match(source, /<a href="\$\{guestPath\}">View conversations<\/a>/);
  assert.doesNotMatch(source, /related\[0\]\.detailPath/);
});
