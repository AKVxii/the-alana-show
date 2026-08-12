import { site } from "./site.js";

// Editorial records live here only when an identity or relationship is manually
// verified. Exact YouTube video IDs and audited guest relationships are the
// static fallback; live YouTube metadata supplies titles, dates, descriptions,
// thumbnails, duration, views, and topic classification whenever available.
export const topics = site.topics;

const verifiedOrganizationIds = {
  "Restoration Bridge International": "restoration-bridge-international"
};

export const organizations = site.organizations.map(organization => ({
  ...organization,
  ...(verifiedOrganizationIds[organization.name] ? { id: verifiedOrganizationIds[organization.name] } : {})
}));

export const guests = [
  { id: "al-cacace", name: "Al Cacace", episodeIds: ["al-cacace-michael-castellano"], conversationCount: 1 },
  { id: "ashley-vertuno", name: "Ashley Vertuno", episodeIds: ["ashley-vertuno"], conversationCount: 1 },
  { id: "bob-sutton", name: "Bob Sutton", episodeIds: ["celeste-ellich-bob-sutton"], conversationCount: 1 },
  { id: "caden-veltkamp", name: "Caden Veltkamp", episodeIds: ["caden-veltkamp-steve-cisneros"], conversationCount: 1 },
  { id: "celeste-ellich", name: "Celeste Ellich", episodeIds: ["celeste-ellich-bob-sutton"], conversationCount: 1 },
  { id: "diana-davis", name: "Diana Davis", episodeIds: ["diana-davis"], conversationCount: 1 },
  { id: "elijah-knight", name: "Elijah Knight", episodeIds: ["elijah-knight"], conversationCount: 1 },
  { id: "george-lemieux", name: "George LeMieux", episodeIds: ["george-lemieux"], conversationCount: 1 },
  { id: "gillian-lieberman", name: "Gillian Lieberman", episodeIds: ["scott-diament-gillian-lieberman"], conversationCount: 1 },
  { id: "jason-mandle", name: "Jason Mandle", episodeIds: ["restoration-bridge-civic-battle-against-hunger"], conversationCount: 1 },
  { id: "jesse-rack", name: "Jesse Rack", episodeIds: ["jesse-rack"], conversationCount: 1 },
  { id: "johana-villafuerte", name: "Johana Villafuerte", episodeIds: ["johana-villafuerte-sabrina-maschue"], conversationCount: 1 },
  { id: "john-rourke", name: "John Rourke", episodeIds: ["john-rourke", "john-rourke-2"], conversationCount: 2 },
  { id: "josh-smith", name: "Josh Smith", episodeIds: ["josh-smith"], conversationCount: 1 },
  { id: "mark-khachaturian", name: "Mark Khachaturian", episodeIds: ["noel-guillama-michael-castellano-mark-khachaturian"], conversationCount: 1 },
  { id: "marvens-beauge", name: "Marvens Beauge", episodeIds: ["michael-saldana-marvens-beauge"], conversationCount: 1 },
  { id: "matthew-yeandle", name: "Matthew Yeandle", episodeIds: ["matthew-yeandle", "matthew-yeandle-2"], conversationCount: 2 },
  { id: "michael-barnett", name: "Michael Barnett", episodeIds: ["restoration-bridge-civic-battle-against-hunger", "michael-barnett-2022-midterms"], conversationCount: 2 },
  { id: "michael-castellano", name: "Michael Castellano", episodeIds: ["noel-guillama-michael-castellano-mark-khachaturian", "al-cacace-michael-castellano", "michael-castellano"], conversationCount: 3 },
  { id: "michael-saldana", name: "Michael Saldana", episodeIds: ["michael-saldana-marvens-beauge"], conversationCount: 1 },
  { id: "nick-cannon", name: "Nick Cannon", episodeIds: ["nick-cannon"], conversationCount: 1 },
  { id: "noel-j-guillama-alvarez", name: "Noel J. Guillama-Alvarez", episodeIds: ["noel-guillama-michael-castellano-mark-khachaturian"], conversationCount: 1 },
  { id: "ric-bradshaw", name: "Sheriff Ric Bradshaw", episodeIds: ["ric-bradshaw"], conversationCount: 1 },
  { id: "rick-morris", name: "Rick Morris", episodeIds: ["rick-morris"], conversationCount: 1 },
  { id: "sabrina-maschue", name: "Sabrina Maschue", episodeIds: ["johana-villafuerte-sabrina-maschue"], conversationCount: 1 },
  { id: "scott-diament", name: "Scott Diament", episodeIds: ["scott-diament-gillian-lieberman"], conversationCount: 1 },
  { id: "stacey-ibarra", name: "Stacey Ibarra", episodeIds: ["stacey-ibarra-vaughn-mitchell"], conversationCount: 1 },
  { id: "steve-cisneros", name: "Steve Cisneros", episodeIds: ["caden-veltkamp-steve-cisneros"], conversationCount: 1 },
  { id: "thais-glysson", name: "Thais Glysson", episodeIds: ["thais-glysson"], conversationCount: 1 },
  { id: "vaughn-mitchell", name: "Vaughn Mitchell", episodeIds: ["stacey-ibarra-vaughn-mitchell"], conversationCount: 1 }
];

export const episodes = [
  { id: "scott-diament-gillian-lieberman", videoId: "NN9mSARhmIQ", title: "Gillian Lieberman & Scott Diament: Palm Beach Business, Luxury & Leadership", guestIds: ["gillian-lieberman", "scott-diament"], detailPath: "/episodes/scott-diament-gillian-lieberman/", canonical: { title: "Gillian Lieberman & Scott Diament: Palm Beach Business, Luxury & Leadership", description: "Gillian Lieberman and Scott Diament join Alana K. Vandeveer on The Alana Show for a featured conversation about Palm Beach business, luxury, leadership, entrepreneurship and legacy.\n\nDrawing from their work across Provident Realty, Provident Jewelry and the Palm Beach Show Group, Gillian and Scott share perspectives from the worlds of real estate, luxury, entrepreneurship, major events and business in South Florida.\n\nGillian Lieberman\nDirector of Real Estate Sales Operations\nProvident Realty of South Florida, Inc.\n\nScott Diament\nSouth Florida entrepreneur, luxury jeweler and event producer; co-founder of Provident Jewelry; CEO of the Palm Beach Show Group; and Founder & Licensed Florida Broker of Provident Realty.\n\nHosted by Alana K. Vandeveer, The Alana Show brings together real conversations and distinct voices from business, leadership, public service, culture, sports, innovation and the communities shaping South Florida and beyond.\n\nThe Alana Show\nReal Conversations. Distinct Voices.", publishedAt: "2026-08-06T15:17:25Z", durationSeconds: 1662, thumbnail: "https://i.ytimg.com/vi/NN9mSARhmIQ/maxresdefault.jpg" } },
  { id: "george-lemieux", videoId: "VYXrV-WGiHM", title: "Conversation with George LeMieux", guestIds: ["george-lemieux"], detailPath: "/episodes/george-lemieux/" },
  { id: "stacey-ibarra-vaughn-mitchell", videoId: "iR4cdm9Ux3U", title: "Conversation with Stacey Ibarra & Vaughn Mitchell", guestIds: ["stacey-ibarra", "vaughn-mitchell"], detailPath: "/episodes/stacey-ibarra-vaughn-mitchell/" },
  { id: "nick-cannon", videoId: "h_A5sgFQOhs", title: "Conversation with Nick Cannon", guestIds: ["nick-cannon"], detailPath: "/episodes/nick-cannon/" },
  { id: "ashley-vertuno", videoId: "FfxuRlf03HY", title: "Conversation with Ashley Vertuno", guestIds: ["ashley-vertuno"], detailPath: "/episodes/ashley-vertuno/" },
  { id: "thais-glysson", videoId: "fv8WM35qH2A", title: "Conversation with Thais Glysson", guestIds: ["thais-glysson"], detailPath: "/episodes/thais-glysson/" },
  { id: "celeste-ellich-bob-sutton", videoId: "snHnh_fDJqk", title: "Conversation with Celeste Ellich & Bob Sutton", guestIds: ["celeste-ellich", "bob-sutton"], detailPath: "/episodes/celeste-ellich-bob-sutton/" },
  { id: "johana-villafuerte-sabrina-maschue", videoId: "Mi_cy88kM40", title: "Conversation with Johana Villafuerte & Sabrina Maschue", guestIds: ["johana-villafuerte", "sabrina-maschue"], detailPath: "/episodes/johana-villafuerte-sabrina-maschue/" },
  { id: "noel-guillama-michael-castellano-mark-khachaturian", videoId: "7hGs2kuAKMk", title: "Conversation with Noel J. Guillama-Alvarez, Michael Castellano & Mark Khachaturian", guestIds: ["noel-j-guillama-alvarez", "michael-castellano", "mark-khachaturian"], detailPath: "/episodes/noel-guillama-michael-castellano-mark-khachaturian/" },
  { id: "ric-bradshaw", videoId: "c3Nly17ax8k", title: "Conversation with Sheriff Ric Bradshaw", guestIds: ["ric-bradshaw"], detailPath: "/episodes/ric-bradshaw/" },
  { id: "caden-veltkamp-steve-cisneros", videoId: "gKUMivhvcao", title: "Conversation with Caden Veltkamp & Steve Cisneros", guestIds: ["caden-veltkamp", "steve-cisneros"], detailPath: "/episodes/caden-veltkamp-steve-cisneros/" },
  { id: "al-cacace-michael-castellano", videoId: "9JCPza2y360", title: "Conversation with Al Cacace & Michael Castellano", guestIds: ["al-cacace", "michael-castellano"], detailPath: "/episodes/al-cacace-michael-castellano/" },
  { id: "jesse-rack", videoId: "9gMEaaiFp0g", title: "Conversation with Jesse Rack", guestIds: ["jesse-rack"], detailPath: "/episodes/jesse-rack/" },
  { id: "restoration-bridge-civic-battle-against-hunger", videoId: "y5dQET3O1-c", title: "Restoration Bridge International - The Civic Battle Against Hunger: RBI's Jason Mandle & Former County Commissioner Michael Barnett on Leadership & Hope", guestIds: ["jason-mandle", "michael-barnett"], organizationIds: ["restoration-bridge-international"], detailPath: "/episodes/restoration-bridge-civic-battle-against-hunger/" },
  { id: "michael-saldana-marvens-beauge", videoId: "gde_JMgSeWY", title: "Conversation with Michael Saldana & Marvens Beauge", guestIds: ["michael-saldana", "marvens-beauge"], detailPath: "/episodes/michael-saldana-marvens-beauge/" },
  { id: "diana-davis", videoId: "ldnVxmeLNRI", title: "Conversation with Diana Davis", guestIds: ["diana-davis"], detailPath: "/episodes/diana-davis/" },
  { id: "rick-morris", videoId: "sN2tg9PNvxY", title: "Conversation with Rick Morris", guestIds: ["rick-morris"], detailPath: "/episodes/rick-morris/" },
  { id: "josh-smith", videoId: "xxIwy_H8GyA", title: "Conversation with Josh Smith", guestIds: ["josh-smith"], detailPath: "/episodes/josh-smith/" },
  { id: "michael-castellano", videoId: "LH0ARaZl1dY", title: "Conversation with Michael Castellano", guestIds: ["michael-castellano"], detailPath: "/episodes/michael-castellano/" },
  { id: "matthew-yeandle", videoId: "Ef9qLLyZY0o", title: "Conversation with Matthew Yeandle", guestIds: ["matthew-yeandle"], detailPath: "/episodes/matthew-yeandle/" },
  { id: "john-rourke", videoId: "QyFKU1ubZQE", title: "Conversation with John Rourke", guestIds: ["john-rourke"], detailPath: "/episodes/john-rourke/" },
  { id: "matthew-yeandle-2", videoId: "UINLMza4HPQ", title: "Conversation with Matthew Yeandle", guestIds: ["matthew-yeandle"], detailPath: "/episodes/matthew-yeandle-2/" },
  { id: "michael-barnett-2022-midterms", videoId: "kJWFTnWOgYM", title: "Chairman Michael Barnett Recaps the 2022 Midterms", guestIds: ["michael-barnett"], detailPath: "/episodes/michael-barnett-2022-midterms/" },
  { id: "john-rourke-2", videoId: "KCIFHIGvEWM", title: "Conversation with John Rourke", guestIds: ["john-rourke"], detailPath: "/episodes/john-rourke-2/" },
  { id: "elijah-knight", videoId: "HCAlWzWTig4", title: "Conversation with Elijah Knight", guestIds: ["elijah-knight"], detailPath: "/episodes/elijah-knight/" }
];

export function guestById(id) {
  return guests.find(guest => guest.id === id);
}

export function episodeById(id) {
  return episodes.find(episode => episode.id === id);
}

export function episodeByVideoId(videoId) {
  return episodes.find(episode => episode.videoId === videoId);
}

export function organizationById(id) {
  return organizations.find(organization => organization.id === id);
}

export function enrichEpisode(apiEpisode) {
  const editorial = episodes.find(episode => episode.videoId === apiEpisode.videoId);
  if (!editorial) return apiEpisode;
  const canonical = editorial.canonical || {};
  return {
    ...apiEpisode,
    ...editorial,
    ...canonical,
    title: canonical.title || apiEpisode.title || editorial.title,
    description: canonical.description || apiEpisode.description || "",
    publishedAt: canonical.publishedAt || apiEpisode.publishedAt || "",
    durationSeconds: canonical.durationSeconds || apiEpisode.durationSeconds || 0,
    thumbnail: canonical.thumbnail || apiEpisode.thumbnail || "",
    guestNames: apiEpisode.guestNames?.length
      ? apiEpisode.guestNames
      : editorial.guestIds.map(id => guestById(id)?.name).filter(Boolean),
    guestIds: editorial.guestIds
  };
}
