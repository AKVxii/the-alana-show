import { resolveCollection } from "../data/collections.js";

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
    const queryMatch = queryCollection
      ? collection === queryCollection.name
      : !normalizedQuery || haystack.includes(normalizedQuery);
    return categoryMatch && queryMatch;
  });
}
