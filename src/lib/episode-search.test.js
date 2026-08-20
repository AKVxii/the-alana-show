import assert from "node:assert/strict";
import test from "node:test";

import { mergeEpisodeSources } from "./episode-search.js";

test("partial live feeds retain live order and append missing canonical episodes", () => {
  const live = [
    { videoId: "live-newest", title: "Live newest" },
    { videoId: "shared-id", title: "Live metadata wins" }
  ];
  const canonical = [
    { videoId: "featured-id", title: "Featured canonical" },
    { videoId: "shared-id", title: "Canonical duplicate" },
    { videoId: "archive-id", title: "Archive canonical" }
  ];

  const merged = mergeEpisodeSources(live, canonical);

  assert.deepEqual(merged.map(episode => episode.videoId), [
    "live-newest",
    "shared-id",
    "featured-id",
    "archive-id"
  ]);
  assert.equal(merged[1].title, "Live metadata wins");
});

test("episode source merging ignores invalid entries and empty sources", () => {
  assert.deepEqual(
    mergeEpisodeSources(null, [{ title: "Missing ID" }], [{ videoId: "verified" }]),
    [{ videoId: "verified" }]
  );
});
