import assert from "node:assert/strict";
import test from "node:test";

import { episodes, guests } from "./catalog.js";
import {
  CANDIDATES_COLLECTION, CANDIDATES_DISCLAIMER, CANDIDATES_LABEL,
  isVerifiedCandidateEpisode, isVerifiedCandidateGuest, resolveCollection
} from "./collections.js";
import { searchEpisodes } from "../lib/episode-search.js";

test("all candidate search aliases resolve case-insensitively to one collection", () => {
  for (const alias of ["Candidates 2026", "2026 Candidates", "2026 Candidates Special", "cAnDiDaTeS 2026"]) {
    assert.equal(resolveCollection(alias)?.name, CANDIDATES_COLLECTION);
  }
});

test("candidate collection search and guest-name search preserve verified metadata", () => {
  const fixture = {
    videoId: "verified-fixture", title: "Original verified title", guestNames: ["Verified Person"],
    candidateInterviewVerified: true, electionCycle: 2026, collection: CANDIDATES_COLLECTION,
    categories: ["Candidates 2026"]
  };
  for (const alias of ["Candidates 2026", "2026 Candidates", CANDIDATES_COLLECTION]) {
    assert.deepEqual(searchEpisodes([fixture], alias), [fixture]);
  }
  assert.deepEqual(searchEpisodes([fixture], "Verified Person"), [fixture]);
  assert.deepEqual(searchEpisodes([fixture], "", CANDIDATES_COLLECTION), [fixture]);
});

test("classification requires every explicit verification field", () => {
  const verified = { candidateInterviewVerified: true, electionCycle: 2026, collection: CANDIDATES_COLLECTION };
  assert.equal(isVerifiedCandidateEpisode(verified), true);
  for (const incomplete of [
    { electionCycle: 2026, collection: CANDIDATES_COLLECTION },
    { candidateInterviewVerified: true, collection: CANDIDATES_COLLECTION },
    { candidateInterviewVerified: true, electionCycle: 2026 },
    { ...verified, electionCycle: 2024 }
  ]) assert.equal(isVerifiedCandidateEpisode(incomplete), false);
});

test("existing civic records remain non-candidates and collection stays empty", () => {
  assert.equal(episodes.filter(isVerifiedCandidateEpisode).length, 0);
  assert.equal(guests.filter(guest => isVerifiedCandidateGuest(guest, episodes)).length, 0);
  assert.equal(searchEpisodes(episodes, CANDIDATES_COLLECTION).length, 0);
  assert.ok(episodes.some(episode => /2022 Midterms/.test(episode.title)));
  for (const term of ["government", "policy", "public service", "community", "elected official"]) {
    assert.equal(resolveCollection(term), null);
  }
  assert.equal(CANDIDATES_LABEL, "2026 Candidate");
  assert.equal(CANDIDATES_DISCLAIMER, "Candidate interviews are presented for public information and do not constitute an endorsement. Participation, scheduling, and any advertising arrangements are handled separately.");
});
