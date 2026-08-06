export const CANDIDATES_COLLECTION = "2026 Candidates Special";
export const CANDIDATES_TOPIC = "Candidates 2026";
export const CANDIDATES_LABEL = "2026 Candidate";
export const CANDIDATES_DISCLAIMER = "Candidate interviews are presented for public information and do not constitute an endorsement. Participation, scheduling, and any advertising arrangements are handled separately.";

export const collections = Object.freeze([
  Object.freeze({
    name: CANDIDATES_COLLECTION,
    aliases: Object.freeze([CANDIDATES_TOPIC, "2026 Candidates", CANDIDATES_COLLECTION]),
    disclaimer: CANDIDATES_DISCLAIMER
  })
]);

export function normalizeSearchTerm(value = "") {
  return String(value).trim().toLocaleLowerCase("en-US").replace(/\s+/g, " ");
}

export function resolveCollection(value = "") {
  const normalized = normalizeSearchTerm(value);
  if (!normalized) return null;
  return collections.find(collection =>
    collection.aliases.some(alias => normalizeSearchTerm(alias) === normalized)
  ) || null;
}

// Candidate classification is deliberately opt-in. General political, civic,
// government, policy, or public-service metadata must never imply candidacy.
export function isVerifiedCandidateEpisode(episode = {}) {
  return episode.candidateInterviewVerified === true &&
    episode.electionCycle === 2026 &&
    episode.collection === CANDIDATES_COLLECTION;
}

export function isVerifiedCandidateGuest(guest = {}, episodeRecords = []) {
  return guest.candidateInterviewVerified === true && episodeRecords.some(episode =>
    guest.episodeIds?.includes(episode.id) && isVerifiedCandidateEpisode(episode)
  );
}
