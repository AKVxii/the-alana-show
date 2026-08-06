import { site } from "./site.js";

// Editorial records live here only when an identity or relationship is manually
// verified. Add a guest profile explicitly, then connect every verified episode
// with its exact YouTube videoId; one episode may reference multiple guestIds.
// Never create guests by parsing runtime titles. Omit unavailable biographies,
// portraits, summaries, quotes, social links, transcripts, and sponsor details
// rather than inventing them. The YouTube API remains the metadata source.
export const topics = site.topics;

const verifiedOrganizationIds = {
  "Restoration Bridge International": "restoration-bridge-international"
};

export const organizations = site.organizations.map(organization => ({
  ...organization,
  ...(verifiedOrganizationIds[organization.name] ? { id: verifiedOrganizationIds[organization.name] } : {})
}));

export const guests = [
  {
    id: "michael-barnett",
    name: "Michael Barnett",
    episodeIds: [
      "michael-barnett-2022-midterms",
      "restoration-bridge-civic-battle-against-hunger"
    ]
  },
  {
    id: "jason-mandle",
    name: "Jason Mandle",
    episodeIds: ["restoration-bridge-civic-battle-against-hunger"]
  }
];

export const episodes = [
  {
    id: "michael-barnett-2022-midterms",
    videoId: "kJWFTnWOgYM",
    title: "Chairman Michael Barnett Recaps the 2022 Midterms",
    guestIds: ["michael-barnett"],
    detailPath: "/episodes/michael-barnett-2022-midterms/"
  },
  {
    id: "restoration-bridge-civic-battle-against-hunger",
    videoId: "y5dQET3O1-c",
    title: "Restoration Bridge International - The Civic Battle Against Hunger: RBI's Jason Mandle & Former County Commissioner Michael Barnett on Leadership & Hope",
    guestIds: ["michael-barnett", "jason-mandle"],
    organizationIds: ["restoration-bridge-international"],
    detailPath: "/episodes/restoration-bridge-civic-battle-against-hunger/"
  }
];

export function guestById(id) {
  return guests.find(guest => guest.id === id);
}

export function episodeById(id) {
  return episodes.find(episode => episode.id === id);
}

export function organizationById(id) {
  return organizations.find(organization => organization.id === id);
}

export function enrichEpisode(apiEpisode) {
  const editorial = episodes.find(episode => episode.videoId === apiEpisode.videoId);
  return editorial ? {
    ...apiEpisode,
    ...editorial,
    title: apiEpisode.title || editorial.title,
    guestNames: editorial.guestIds.map(id => guestById(id)?.name).filter(Boolean)
  } : apiEpisode;
}
