import { site } from "./site.js";

// Editorial records live here only when an identity or relationship is verified.
// The YouTube API remains the source of episode metadata and is merged by videoId.
export const topics = site.topics;

export const organizations = site.organizations.map(organization => ({ ...organization }));

export const guests = [
  {
    id: "michael-barnett",
    name: "Michael Barnett",
    episodeIds: ["michael-barnett-2022-midterms"]
  }
];

export const episodes = [
  {
    id: "michael-barnett-2022-midterms",
    videoId: "kJWFTnWOgYM",
    title: "Chairman Michael Barnett Recaps the 2022 Midterms",
    guestIds: ["michael-barnett"],
    detailPath: "/episodes/michael-barnett-2022-midterms/"
  }
];

export function guestById(id) {
  return guests.find(guest => guest.id === id);
}

export function episodeById(id) {
  return episodes.find(episode => episode.id === id);
}

export function enrichEpisode(apiEpisode) {
  const editorial = episodes.find(episode => episode.videoId === apiEpisode.videoId);
  return editorial ? { ...apiEpisode, ...editorial, title: apiEpisode.title || editorial.title } : apiEpisode;
}
