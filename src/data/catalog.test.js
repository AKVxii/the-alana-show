import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { episodeById, episodes, guests } from "./catalog.js";
import { searchEpisodes } from "../lib/episode-search.js";
import { episodeCard, episodeThumbnailUrl, relatedConversationRow } from "../lib/media-page.js";

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
    ["y5dQET3O1-c", "kJWFTnWOgYM"]
  );
  assert.deepEqual(
    searchEpisodes(episodes, "Jason Mandle").map(episode => episode.videoId),
    ["y5dQET3O1-c"]
  );
});

test("editorial episodes remain complete, distinct and newest-first", () => {
  assert.equal(new Set(episodes.map(episode => episode.id)).size, episodes.length);
  assert.equal(new Set(episodes.map(episode => episode.videoId)).size, episodes.length);
  assert.ok(episodes.every(episode => episode.canonical?.title === episode.title));
  assert.ok(episodes.every(episode => episode.canonical?.deck));
  assert.ok(episodes.every(episode => episode.canonical?.description));
  assert.ok(episodes.every(episode => Number.isFinite(episode.canonical?.durationSeconds) && episode.canonical.durationSeconds > 0));
  assert.ok(episodes.every(episode => !/^Conversation with\b/i.test(episode.title)));
  assert.ok(episodes.every(episode => episode.guestNames.length === episode.guestIds.length));

  const timestamps = episodes.map(episode => Date.parse(episode.publishedAt));
  assert.ok(timestamps.every(Number.isFinite));
  assert.deepEqual(timestamps, [...timestamps].sort((a, b) => b - a));
});

test("guest directory preserves profiles and routes new guests to filtered episodes", async () => {
  const source = await readFile(new URL("../guests-page.js", import.meta.url), "utf8");

  assert.ok(source.includes('href="${guestPath}">View conversations'));
  assert.ok(source.includes("guestConversationPath(guest)"));
  assert.doesNotMatch(source, /related\\[0\\]\\.detailPath/);
});

test("guest detail related conversations render compact thumbnail rows", () => {
  const michaelBarnett = guests.find(guest => guest.id === "michael-barnett");
  const jasonMandle = guests.find(guest => guest.id === "jason-mandle");
  const michaelRows = michaelBarnett.episodeIds.map(episodeById).map(relatedConversationRow);
  const jasonRows = jasonMandle.episodeIds.map(episodeById).map(relatedConversationRow);

  assert.equal(michaelRows.length, 2);
  assert.equal(jasonRows.length, 1);
  assert.ok(michaelRows.every(row => row.includes("related-conversation-thumb")));
  assert.ok(jasonRows.every(row => row.includes("related-conversation-thumb")));
  assert.equal(episodeThumbnailUrl(episodeById("michael-barnett-2022-midterms")), "https://i.ytimg.com/vi/kJWFTnWOgYM/maxresdefault.jpg");
  assert.equal(episodeThumbnailUrl(episodeById("restoration-bridge-civic-battle-against-hunger")), "https://i.ytimg.com/vi/y5dQET3O1-c/maxresdefault.jpg");
});

test("savable archive cards use one conversation destination and a separate save control", () => {
  const card = episodeCard(episodeById("george-lemieux"), { savable: true });
  const destination = 'href="/episodes/george-lemieux/"';

  assert.equal(card.split(destination).length - 1, 1);
  assert.match(card, /data-episode-primary-link/);
  assert.match(card, /<button[^>]+data-save-episode=/);
  assert.doesNotMatch(card, /media-card-actions"><a/);
});
