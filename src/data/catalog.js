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
  { id: "al-cacace", name: "Al Cacace", episodeIds: [], conversationCount: 1 },
  { id: "ashley-vertuno", name: "Ashley Vertuno", episodeIds: [], conversationCount: 1 },
  { id: "bob-sutton", name: "Bob Sutton", episodeIds: [], conversationCount: 1 },
  { id: "caden-veltkamp", name: "Caden Veltkamp", episodeIds: [], conversationCount: 1 },
  { id: "celeste-ellich", name: "Celeste Ellich", episodeIds: [], conversationCount: 1 },
  { id: "diana-davis", name: "Diana Davis", episodeIds: [], conversationCount: 1 },
  { id: "elijah-knight", name: "Elijah Knight", episodeIds: [], conversationCount: 1 },
  { id: "george-lemieux", name: "George LeMieux", episodeIds: [], conversationCount: 1 },
  { id: "gillian-lieberman", name: "Gillian Lieberman", episodeIds: [], conversationCount: 1 },
  { id: "jason-mandle", name: "Jason Mandle", episodeIds: ["restoration-bridge-civic-battle-against-hunger"], conversationCount: 1 },
  { id: "jesse-rack", name: "Jesse Rack", episodeIds: [], conversationCount: 1 },
  { id: "johana-villafuerte", name: "Johana Villafuerte", episodeIds: [], conversationCount: 1 },
  { id: "john-rourke", name: "John Rourke", episodeIds: [], conversationCount: 2 },
  { id: "josh-smith", name: "Josh Smith", episodeIds: [], conversationCount: 1 },
  { id: "mark-khachaturian", name: "Mark Khachaturian", episodeIds: [], conversationCount: 1 },
  { id: "marvens-beauge", name: "Marvens Beauge", episodeIds: [], conversationCount: 1 },
  { id: "matthew-yeandle", name: "Matthew Yeandle", episodeIds: [], conversationCount: 2 },
  { id: "michael-barnett", name: "Michael Barnett", episodeIds: ["michael-barnett-2022-midterms", "restoration-bridge-civic-battle-against-hunger"], conversationCount: 2 },
  { id: "michael-castellano", name: "Michael Castellano", episodeIds: [], conversationCount: 3 },
  { id: "michael-saldana", name: "Michael Saldana", episodeIds: [], conversationCount: 1 },
  { id: "nick-cannon", name: "Nick Cannon", episodeIds: [], conversationCount: 1 },
  { id: "noel-j-guillama-alvarez", name: "Noel J. Guillama-Alvarez", episodeIds: [], conversationCount: 1 },
  { id: "ric-bradshaw", name: "Sheriff Ric Bradshaw", episodeIds: [], conversationCount: 1 },
  { id: "rick-morris", name: "Rick Morris", episodeIds: [], conversationCount: 1 },
  { id: "sabrina-maschue", name: "Sabrina Maschue", episodeIds: [], conversationCount: 1 },
  { id: "scott-diament", name: "Scott Diament", episodeIds: [], conversationCount: 1 },
  { id: "stacey-ibarra", name: "Stacey Ibarra", episodeIds: [], conversationCount: 1 },
  { id: "steve-cisneros", name: "Steve Cisneros", episodeIds: [], conversationCount: 1 },
  { id: "thais-glysson", name: "Thais Glysson", episodeIds: [], conversationCount: 1 },
  { id: "vaughn-mitchell", name: "Vaughn Mitchell", episodeIds: [], conversationCount: 1 }
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
    guestNames: apiEpisode.guestNames?.length
      ? apiEpisode.guestNames
      : editorial.guestIds.map(id => guestById(id)?.name).filter(Boolean),
    guestIds: apiEpisode.guestIds?.length ? apiEpisode.guestIds : editorial.guestIds
  } : apiEpisode;
}
