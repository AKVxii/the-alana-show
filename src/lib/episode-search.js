export function uniqueEpisodes(episodes = []) {
  const seen = new Set();
  return episodes.filter(episode => {
    if (!episode?.videoId || seen.has(episode.videoId)) return false;
    seen.add(episode.videoId);
    return true;
  });
}

export function searchEpisodes(episodes = [], query = "", category = "") {
  const normalizedQuery = query.trim().toLowerCase();
  return uniqueEpisodes(episodes).filter(episode => {
    const categories = Array.isArray(episode.categories) ? episode.categories : [];
    const tags = Array.isArray(episode.tags) ? episode.tags : [];
    const categoryMatch = !category || categories.includes(category);
    const haystack = [
      episode.title || "",
      episode.description || "",
      ...categories,
      ...tags
    ].join(" ").toLowerCase();
    return categoryMatch && (!normalizedQuery || haystack.includes(normalizedQuery));
  });
}
