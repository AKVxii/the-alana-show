/*
 * Auditable guest identity rules for the YouTube archive.
 *
 * Exact video IDs are the editorial source of truth and always win over the
 * deliberately narrow metadata parser. Add an entry here whenever an episode
 * title is not unambiguous on its own. Never add a role, affiliation, or other
 * biographical claim to make an identity appear more complete.
 */
const guestIdentityByVideoId = Object.freeze({
  "kJWFTnWOgYM": Object.freeze(["Michael Barnett"]),
  "y5dQET3O1-c": Object.freeze(["Jason Mandle", "Michael Barnett"])
});

const canonicalNames = Object.freeze({
  "jason mandle": "Jason Mandle",
  "michael barnett": "Michael Barnett"
});

const HOST_KEYS = new Set([
  "alana k vandeveer", "alana vandeveer", "alana katherine vandeveer"
]);
const NON_PERSON_WORDS = /\b(?:show|podcast|international|foundation|association|organization|committee|commission|council|department|office|county|city|district|school|university|church|bridge|battle|hunger|election|midterms?|special|episode|conversation|update|news|radio|sponsor)\b/i;
const PERSON_TOKEN = "(?:[A-Z][A-Za-z'’.-]+|[A-Z]\\.)";
const PERSON_NAME = new RegExp(`^(?:${PERSON_TOKEN}\\s+){1,4}${PERSON_TOKEN}$`);
const ROLE_PREFIX = /^(?:(?:dr|mr|mrs|ms|chairman|chairwoman|commissioner|mayor|senator|representative|judge|pastor|attorney|former)\.?\s+)+/i;

function identityKey(value = "") {
  return String(value)
    .normalize("NFKD").replace(/[\u0300-\u036f]/g, "")
    .toLowerCase().replace(/\b(?:dr|mr|mrs|ms)\.?\b/g, " ")
    .replace(/[^a-z0-9]+/g, " ").trim().replace(/\s+/g, " ");
}

function canonicalGuestName(value = "") {
  const cleaned = String(value).replace(ROLE_PREFIX, "").replace(/[,:;.!?]+$/g, "").trim();
  const key = identityKey(cleaned);
  if (!key || HOST_KEYS.has(key)) return null;
  return canonicalNames[key] || cleaned;
}

function isClearlyHumanName(value = "") {
  const cleaned = String(value).replace(ROLE_PREFIX, "").trim();
  const canonical = canonicalGuestName(cleaned);
  return Boolean(canonical && PERSON_NAME.test(cleaned) && !NON_PERSON_WORDS.test(cleaned));
}

function splitPeople(value = "") {
  return value.split(/\s*(?:,|&|\band\b)\s*/i).map(part => part.trim()).filter(Boolean);
}

function extractClearlyNamedGuests({ title = "", description = "" } = {}) {
  const candidates = [];
  // These labels make an editorial assertion that what follows is a guest.
  for (const match of String(description).matchAll(/(?:^|[\n|])\s*(?:guest|guests|featuring)\s*:\s*([^\n|]{3,160})/gim)) {
    candidates.push(...splitPeople(match[1]));
  }
  // A title ending in "with First Last" is safe only when every captured item
  // independently has the shape of a human name.
  const withMatch = String(title).match(/\bwith\s+([^:|–—-]{3,120})(?:\s+[|–—-]\s+.*)?$/i);
  if (withMatch) candidates.push(...splitPeople(withMatch[1]));

  const names = candidates.filter(isClearlyHumanName).map(canonicalGuestName);
  return [...new Map(names.map(name => [identityKey(name), name])).values()];
}

function hasGuestCue({ title = "", description = "" } = {}) {
  return /(?:^|[\n|])\s*(?:guest|guests|featuring)\s*:/im.test(description) || /\bwith\b/i.test(title);
}

function identifyEpisodeGuests(episode = {}) {
  const mapped = guestIdentityByVideoId[episode.videoId];
  const guestNames = mapped ? [...mapped] : extractClearlyNamedGuests(episode);
  return {
    guestNames,
    guestIds: guestNames.map(name => identityKey(name).replace(/\s+/g, "-")),
    guestIdentitySource: mapped ? "editorial" : guestNames.length ? "metadata" : "none",
    unresolvedGuestAudit: !mapped && !guestNames.length && hasGuestCue(episode)
      ? { videoId: episode.videoId, title: episode.title, reason: "Guest wording did not clearly identify a human name." }
      : null
  };
}

module.exports = {
  canonicalGuestName,
  extractClearlyNamedGuests,
  guestIdentityByVideoId,
  identityKey,
  identifyEpisodeGuests,
  isClearlyHumanName
};
