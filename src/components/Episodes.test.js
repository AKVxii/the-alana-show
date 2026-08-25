import test from "node:test";
import assert from "node:assert/strict";
import { EpisodeThumbnail, normalizeThumbnailUrl } from "./Episodes.js";

test("normalizes legacy YouTube thumbnail URLs to the working official host", () => {
  const legacy = "https://i.ytimg.com/vi/Kx7rcDzaqDk/maxresdefault.jpg";
  const preferred = "https://img.youtube.com/vi/Kx7rcDzaqDk/maxresdefault.jpg";

  assert.equal(normalizeThumbnailUrl(legacy), preferred);
  assert.match(EpisodeThumbnail({ videoId: "Kx7rcDzaqDk", title: "George LeMieux", thumbnail: legacy }), /src="https:\/\/img\.youtube\.com\//);
});

test("preserves valid non-YouTube artwork and rejects unsafe protocols", () => {
  assert.equal(normalizeThumbnailUrl("https://cdn.example.com/episode.jpg"), "https://cdn.example.com/episode.jpg");
  assert.equal(normalizeThumbnailUrl("javascript:alert(1)"), "");
});
