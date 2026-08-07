const STATIC_GUEST_IDS = new Set(["michael-barnett", "jason-mandle"]);

export function guestIdentityKey(value = "") {
  return String(value).normalize("NFKD").replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("en-US").replace(/\b(?:dr|mr|mrs|ms)\.?\b/g, " ")
    .replace(/[^a-z0-9]+/g, " ").trim().replace(/\s+/g, " ");
}

export function guestSlug(name = "") {
  return guestIdentityKey(name).replace(/\s+/g, "-");
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
    conversationCount: guest.videoIds.length
      ? new Set(guest.videoIds).size
      : new Set(guest.episodeIds).size,
    detailPath: STATIC_GUEST_IDS.has(guest.id) ? `/guests/${guest.id}/` : ""
  })).sort((a, b) => a.name.localeCompare(b.name, "en", { sensitivity: "base" }));
}

export function guestConversationPath(guest) {
  return guest.detailPath || `/episodes/?guest=${encodeURIComponent(guest.name)}`;
}

export function filterGuests(guests = [], query = "", letter = "") {
  const needle = guestIdentityKey(query);
  return guests.filter(guest => (!letter || guest.name.toUpperCase().startsWith(letter)) &&
    (!needle || guestIdentityKey(guest.name).includes(needle)));
}
