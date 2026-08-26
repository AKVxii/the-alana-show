const STATIC_GUEST_IDS = new Set([
  "al-cacace", "ashley-vertuno", "bob-sutton", "caden-veltkamp", "celeste-ellich",
  "diana-davis", "elijah-knight", "george-lemieux", "gillian-lieberman", "jason-mandle",
  "jesse-rack", "johana-villafuerte", "john-rourke", "josh-smith", "mark-khachaturian",
  "marvens-beauge", "matthew-yeandle", "michael-barnett", "michael-castellano", "michael-saldana",
  "nick-cannon", "noel-j-guillama-alvarez", "ric-bradshaw", "rick-morris", "sabrina-maschue",
  "scott-diament", "stacey-ibarra", "steve-cisneros", "thais-glysson", "vaughn-mitchell"
]);
const SORT_SURNAME_OVERRIDES = new Map([
  ["ric bradshaw", "Bradshaw"],
  ["michael barnett", "Barnett"],
  ["nick cannon", "Cannon"],
  ["thais glysson", "Glysson"],
  ["jason mandle", "Mandle"],
  ["ashley vertuno", "Vertuno"]
]);
const PROFESSIONAL_TITLE = /^(?:(?:sheriff|dr|mayor|commissioner|chairman|chairwoman|senator|representative|judge|pastor|attorney)\.?\s+)+/i;
const SUFFIX = /\s+(?:jr|sr|ii|iii|iv)\.?$/i;

export function guestIdentityKey(value = "") {
  return String(value).normalize("NFKD").replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("en-US").replace(/\b(?:sheriff|dr|mr|mrs|ms|mayor|commissioner|chairman|chairwoman|senator|representative|judge|pastor|attorney)\.?\b/g, " ")
    .replace(/[^a-z0-9]+/g, " ").trim().replace(/\s+/g, " ");
}

export function guestSlug(name = "") {
  return guestIdentityKey(name).replace(/\s+/g, "-");
}

export function guestSurname(name = "", override = "") {
  if (override) return override;
  const known = SORT_SURNAME_OVERRIDES.get(guestIdentityKey(name));
  if (known) return known;
  const sortable = String(name).replace(PROFESSIONAL_TITLE, "").replace(SUFFIX, "").trim();
  return sortable.split(/\s+/).at(-1) || sortable;
}

function guestMatchKey(name = "") {
  const parts = guestIdentityKey(name).split(" ").filter(Boolean);
  return parts.length > 2 ? `${parts[0]} ${parts.at(-1)}` : parts.join(" ");
}

export function buildGuestDirectory(episodeRecords = [], curatedGuests = []) {
  const records = new Map();
  for (const guest of curatedGuests) {
    records.set(guestMatchKey(guest.name), { ...guest, episodeIds: [...(guest.episodeIds || [])], videoIds: [] });
  }
  for (const episode of episodeRecords) {
    for (const name of episode.guestNames || []) {
      const key = guestMatchKey(name);
      if (!key || key === "alana k vandeveer" || key === "alana vandeveer") continue;
      const existing = records.get(key) || { id: guestSlug(name), name, episodeIds: [], videoIds: [] };
      if (episode.id && !existing.episodeIds.includes(episode.id)) existing.episodeIds.push(episode.id);
      if (episode.videoId && !existing.videoIds.includes(episode.videoId)) existing.videoIds.push(episode.videoId);
      records.set(key, existing);
    }
  }
  return [...records.values()].map(guest => ({
    ...guest,
    surname: guestSurname(guest.name, guest.surname),
    sortName: `${guestSurname(guest.name, guest.surname)}, ${guest.name}`,
    conversationCount: guest.videoIds.length
      ? new Set(guest.videoIds).size
      : guest.episodeIds.length
        ? new Set(guest.episodeIds).size
        : guest.conversationCount || 0,
    detailPath: STATIC_GUEST_IDS.has(guest.id) ? `/guests/${guest.id}` : ""
  })).sort((a, b) => a.sortName.localeCompare(b.sortName, "en", { sensitivity: "base" }));
}

export function guestConversationPath(guest) {
  return guest.detailPath || `/episodes/?guest=${encodeURIComponent(guest.name)}`;
}

export function filterGuests(guests = [], query = "", letter = "") {
  const needle = guestIdentityKey(query);
  return guests.filter(guest => (!letter || guest.surname.toUpperCase().startsWith(letter)) &&
    (!needle || guestIdentityKey(guest.name).includes(needle)));
}
