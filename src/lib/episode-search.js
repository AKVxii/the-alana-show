import { resolveCollection } from "../data/collections.js";

function personSearchKey(value = "") {
  const parts = String(value).toLowerCase()
    .replace(/\b(?:sheriff|dr|mayor|commissioner|chairman|chairwoman|senator|representative|judge|pastor|attorney)\.?\b/g, " ")
    .replace(/[^a-z0-9]+/g, " ").trim().split(/\s+/).filter(Boolean);
  return parts.length > 2 ? `${parts[0]} ${parts.at(-1)}` : parts.join(" ");
}

export function resolveCanonicalGuestName(episodes = [], value = "") {
  const key = personSearchKey(value);
  if (!key) return "";
  for (const episode of episodes) {
    const name = (episode.guestNames || []).find(guestName => personSearchKey(guestName) === key);
    if (name) return name;
  }
  return "";
}

export function guestEpisodes(episodes = [], guestName = "") {
  const key = personSearchKey(guestName);
  if (!key) return [];
  return uniqueEpisodes(episodes).filter(episode =>
    (episode.guestNames || []).some(name => personSearchKey(name) === key)
  );
}

export function uniqueEpisodes(episodes = []) {
  const seen = new Set();
  return episodes.filter(episode => {
    if (!episode?.videoId || seen.has(episode.videoId)) return false;
    seen.add(episode.videoId);
    return true;
  });
}

export function searchEpisodes(episodes = [], query = "", category = "") {
  const queryCollection = resolveCollection(query);
  const categoryCollection = resolveCollection(category);
  const normalizedQuery = query.trim().toLowerCase();
  const hostOnlyQuery = ["alana k. vandeveer", "alana k vandeveer", "alana vandeveer"].includes(normalizedQuery);
  return uniqueEpisodes(episodes).filter(episode => {
    const categories = Array.isArray(episode.categories) ? episode.categories : [];
    const tags = Array.isArray(episode.tags) ? episode.tags : [];
    const collection = episode.collection || "";
    const categoryMatch = !category || (categoryCollection
      ? collection === categoryCollection.name
      : categories.includes(category));
    const haystack = [
      episode.title || "",
      episode.description || "",
      ...categories,
      ...tags,
      ...(episode.guestNames || []),
      collection
    ].join(" ").toLowerCase();
    const canonicalGuestMatch = normalizedQuery && (episode.guestNames || []).some(name =>
      personSearchKey(name) === personSearchKey(normalizedQuery)
    );
    const queryMatch = hostOnlyQuery
      ? (episode.guestNames || []).some(name => name.toLowerCase() === normalizedQuery)
      : queryCollection
      ? collection === queryCollection.name
      : !normalizedQuery || canonicalGuestMatch || haystack.includes(normalizedQuery);
    return categoryMatch && queryMatch;
  });
}
