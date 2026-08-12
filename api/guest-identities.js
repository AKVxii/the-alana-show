/*
 * Auditable guest identity rules for the YouTube archive.
 *
 * Exact video IDs are the editorial source of truth and always win over the
 * deliberately narrow metadata parser. Add an entry here whenever an episode
 * title is not unambiguous on its own. Never add a role, affiliation, or other
 * biographical claim to make an identity appear more complete.
 */
const guestIdentityByVideoId = Object.freeze({
  "NN9mSARhmIQ": Object.freeze(["Gillian Lieberman", "Scott Diament"]),
  "VYXrV-WGiHM": Object.freeze(["George LeMieux"]),
  "iR4cdm9Ux3U": Object.freeze(["Stacey Ibarra", "Vaughn Mitchell"]),
  "h_A5sgFQOhs": Object.freeze(["Nick Cannon"]),
  "FfxuRlf03HY": Object.freeze(["Ashley Vertuno"]),
  "fv8WM35qH2A": Object.freeze(["Thais Glysson"]),
  "snHnh_fDJqk": Object.freeze(["Celeste Ellich", "Bob Sutton"]),
  "Mi_cy88kM40": Object.freeze(["Johana Villafuerte", "Sabrina Maschue"]),
  "7hGs2kuAKMk": Object.freeze(["Noel J. Guillama-Alvarez", "Michael Castellano", "Mark Khachaturian"]),
  "c3Nly17ax8k": Object.freeze(["Sheriff Ric Bradshaw"]),
  "gKUMivhvcao": Object.freeze(["Caden Veltkamp", "Steve Cisneros"]),
  "9JCPza2y360": Object.freeze(["Al Cacace", "Michael Castellano"]),
  "9gMEaaiFp0g": Object.freeze(["Jesse Rack"]),
  "y5dQET3O1-c": Object.freeze(["Jason Mandle", "Michael Barnett"]),
  "gde_JMgSeWY": Object.freeze(["Michael Saldana", "Marvens Beauge"]),
  "ldnVxmeLNRI": Object.freeze(["Diana Davis"]),
  "sN2tg9PNvxY": Object.freeze(["Rick Morris"]),
  "xxIwy_H8GyA": Object.freeze(["Josh Smith"]),
  "LH0ARaZl1dY": Object.freeze(["Michael Castellano"]),
  "Ef9qLLyZY0o": Object.freeze(["Matthew Yeandle"]),
  "QyFKU1ubZQE": Object.freeze(["John Rourke"]),
  "UINLMza4HPQ": Object.freeze(["Matthew Yeandle"]),
  "kJWFTnWOgYM": Object.freeze(["Michael Barnett"]),
  "KCIFHIGvEWM": Object.freeze(["John Rourke"]),
  "HCAlWzWTig4": Object.freeze(["Elijah Knight"]),
});

const unresolvedGuestByVideoId = Object.freeze({
  "yyaqtWiOH9s": Object.freeze({
    videoId: "yyaqtWiOH9s",
    title: "Alana I Broker I Commercial Real Estate I Thoughts on Freedom I Political Stories I Involvement I *1",
    reason: "The description identifies only 'Tommy of MSCS Media' and does not provide a complete verified human name. Alana is the interview subject and is not classified as a guest."
  })
});

const canonicalNames = Object.freeze({
  "chairman michael barnett": "Michael Barnett",
  "former commissioner michael a barnett": "Michael Barnett",
  "george lemieux": "George LeMieux",
  "jason mandle": "Jason Mandle",
  "michael a barnett": "Michael Barnett",
  "michael barnett": "Michael Barnett",
  "senator george lemieux": "George LeMieux"
});

const HOST_KEYS = new Set([
  "alana k vandeveer", "alana vandeveer", "alana katherine vandeveer"
]);
const NON_PERSON_WORDS = /\b(?:show|podcast|international|foundation|association|organization|committee|commission|council|department|office|county|city|district|school|university|church|bridge|battle|hunger|election|midterms?|special|episode|conversation|update|news|radio|sponsor)\b/i;
const PERSON_TOKEN = "(?:[A-Z][A-Za-z'’.-]+|[A-Z]\\.)";
const PERSON_NAME = new RegExp(`^(?:${PERSON_TOKEN}\\s+){1,4}${PERSON_TOKEN}$`);
const ROLE_PREFIX = /^(?:(?:dr|mr|mrs|ms|chairman|chairwoman|commissioner|mayor|senator|representative|judge|pastor|attorney|sheriff|former)\.?\s+)+/i;

function identityKey(value = "") {
  return String(value)
    .normalize("NFKD").replace(/[\u0300-\u036f]/g, "")
    .toLowerCase().replace(/\b(?:dr|mr|mrs|ms|sheriff)\.?\b/g, " ")
    .replace(/[^a-z0-9]+/g, " ").trim().replace(/\s+/g, " ");
}

function canonicalGuestName(value = "") {
  const original = String(value).replace(/[,:;.!?]+$/g, "").trim();
  const originalKey = identityKey(original);
  if (!originalKey || HOST_KEYS.has(originalKey)) return null;
  if (canonicalNames[originalKey]) return canonicalNames[originalKey];

  const cleaned = original.replace(ROLE_PREFIX, "").trim();
  const key = identityKey(cleaned);
  if (!key || HOST_KEYS.has(key)) return null;
  return canonicalNames[key] || cleaned;
}

function isClearlyHumanName(value = "") {
  const cleaned = String(value).replace(ROLE_PREFIX, "").trim();
  const canonical = canonicalGuestName(value);
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
  return /(?:^|[\n|])\s*(?:guest|guests|featuring)\s*:/im.test(description) ||
    /\bwith\b/i.test(title) ||
    /\binterview with\b/i.test(description);
}

function identifyEpisodeGuests(episode = {}) {
  const mapped = guestIdentityByVideoId[episode.videoId];
  const unresolved = unresolvedGuestByVideoId[episode.videoId];
  const guestNames = mapped ? [...mapped] : unresolved ? [] : extractClearlyNamedGuests(episode);
  return {
    guestNames,
    guestIds: guestNames.map(name => identityKey(name).replace(/\s+/g, "-")),
    guestIdentitySource: mapped ? "editorial" : guestNames.length ? "metadata" : "none",
    unresolvedGuestAudit: unresolved || (!mapped && !guestNames.length && hasGuestCue(episode)
      ? { videoId: episode.videoId, title: episode.title, reason: "Guest wording did not clearly identify a human name." }
      : null)
  };
}

module.exports = {
  canonicalGuestName,
  extractClearlyNamedGuests,
  guestIdentityByVideoId,
  identityKey,
  identifyEpisodeGuests,
  isClearlyHumanName,
  unresolvedGuestByVideoId
};
