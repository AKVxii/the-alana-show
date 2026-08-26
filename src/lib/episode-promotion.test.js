import assert from "node:assert/strict";
import test from "node:test";

import { episodeEnhancementById } from "../data/episode-enhancements.js";
import { selectPromotionMoments } from "./episode-promotion.js";

test("George LeMieux promotion prioritizes the strongest verified moments", () => {
  const moments = selectPromotionMoments(episodeEnhancementById("george-lemieux"));
  assert.deepEqual(
    moments,
    [
      { title: "Why Character Is Everything", startSeconds: 1669 },
      { title: "America’s Debt and Fiscal Discipline", startSeconds: 1351 },
      { title: "Listening Across Political Divides", startSeconds: 572 }
    ]
  );
});

test("episodes without matching chapters do not receive a promotional strip", () => {
  assert.deepEqual(selectPromotionMoments({ chapters: [{ title: "Introduction", startSeconds: 0 }] }), []);
});
