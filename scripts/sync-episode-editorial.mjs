import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const EPISODES_DIR = path.join(ROOT, "episodes");
const OUTPUT = path.join(ROOT, "src", "data", "episode-editorial.js");

function normalizeThumbnailUrl(value = "") {
  try {
    const url = new URL(value);
    if (url.protocol !== "https:") return "";
    if (url.hostname === "i.ytimg.com") url.hostname = "img.youtube.com";
    return url.href;
  } catch {
    return "";
  }
}

// Editorial titles and decks are based only on the verified descriptions and
// guest relationships already published with each canonical video master.
const EDITORIAL_OVERRIDES = {
  "george-lemieux": {
    deck: "Former U.S. Senator George LeMieux joins Alana K. Vandeveer for a thoughtful conversation about principled leadership, public service, civic responsibility and Florida’s future."
  },
  "scott-diament-gillian-lieberman": {
    deck: "Gillian Lieberman and Scott Diament share perspectives from Palm Beach real estate, luxury, entrepreneurship, major events and the work of building a lasting business legacy."
  },
  "michael-barnett-2022-midterms": {
    deck: "Palm Beach County Republican Party Chairman Michael Barnett reflects on the 2022 midterm results, grassroots organizing and the county’s changing political landscape."
  },
  "stacey-ibarra-vaughn-mitchell": {
    title: "Scam & Fraud Special: Cybercrime, Crypto Scams & Protection",
    deck: "Deputy Chief Assistant State Attorney Stacey Ibarra and PBSO financial-crimes investigator Detective Vaughn Mitchell explain how modern scams use emotion, AI and cryptocurrency—and what victims and families can do."
  },
  "nick-cannon": {
    title: "Service Beyond the Uniform: Veteran Advocacy with Nick Cannon",
    deck: "U.S. Air Force veteran and Wounded Veterans Relief Fund operations director Nick Cannon discusses veteran advocacy, overlooked dental-care needs and how service can continue long after the uniform."
  },
  "ashley-vertuno": {
    title: "Purpose-Driven Healthcare Leadership with Ashley Vertuno, FACHE",
    deck: "HCA Florida JFK North Hospital CEO Ashley Vertuno shares how values, culture, mentorship and disciplined decision-making shape effective healthcare leadership."
  },
  "thais-glysson": {
    title: "Fitness After 40: Strength, Confidence & Hormone-Conscious Training",
    deck: "Holistic fitness coach Thais Glysson shares her 40-pound transformation and a practical approach to strength, mindset and hormone-conscious training for women over 40."
  },
  "celeste-ellich-bob-sutton": {
    title: "The Candidate’s Playbook: Civic Leadership & Running for Office",
    deck: "Navy veteran Celeste Ellich and business strategist Bob Sutton discuss civic responsibility, public-service accountability and the tools first-time candidates need to step into the arena."
  },
  "johana-villafuerte-sabrina-maschue": {
    title: "Reclaiming Strength Through Martial Arts",
    deck: "Johana Villafuerte and Sabrina Maschue of Senjutsu Martial Arts Academy explore how Muay Thai, Jiu-Jitsu and MMA can build grounding, confidence and strength after trauma."
  },
  "noel-guillama-michael-castellano-mark-khachaturian": {
    title: "Reimagining Healthcare: AI, Remote Monitoring & Accessible Wellness",
    deck: "Noel J. Guillama-Alvarez, Michael Castellano and Mark Khachaturian examine how AI, interactive video, medical devices and remote monitoring could make healthcare more connected and accessible."
  },
  "ric-bradshaw": {
    title: "A Legacy of Service: Sheriff Ric Bradshaw on Community-First Policing",
    deck: "Palm Beach County Sheriff Ric Bradshaw reflects on nearly 50 years in law enforcement, community-first policing, multi-agency collaboration and mentoring the next generation."
  },
  "caden-veltkamp-steve-cisneros": {
    title: "Caden Veltkamp: Faith, Perseverance & a Conference USA Breakthrough",
    deck: "FAU quarterback and 2024 Conference USA Offensive Player of the Year Caden Veltkamp discusses faith, mental strength and NFL goals, with perspective from veteran coach Steve Cisneros."
  },
  "al-cacace-michael-castellano": {
    title: "Defending the Digital Frontier: Cybercrime, Identity Theft & AI",
    deck: "Army veteran and cryptography specialist Al Cacace joins digital-forensics and AI strategist Michael Castellano to examine identity theft, cyber fraud and AI’s growing role in security."
  },
  "jesse-rack": {
    title: "Protecting Your Florida Home: Generators, AC & Contractor Red Flags",
    deck: "Rack Electric CEO Jesse Rack offers Florida homeowners practical guidance on standby generators, AC maintenance and spotting bad business practices before they become costly."
  },
  "restoration-bridge-civic-battle-against-hunger": {
    title: "The Civic Battle Against Hunger in Palm Beach County",
    deck: "RBI’s Jason Mandle and former Palm Beach County Commissioner Michael Barnett explain the logistics, partnerships and faith-driven purpose behind fighting food insecurity across the county."
  },
  "michael-saldana-marvens-beauge": {
    title: "From Beginner to Black Belt & Pro Debut: Inside Senjutsu MMA",
    deck: "Michael Saldana and rising pro fighter Marvens Beauge take listeners inside Senjutsu’s blend of MMA disciplines, mentorship, mental strength and community."
  },
  "diana-davis": {
    title: "Art as Activism: Fighting Human Trafficking Through Film",
    deck: "Movies Making a Difference founder Diana Davis explains how socially conscious filmmaking can expose human trafficking, rally communities and support survivors beyond the screen."
  },
  "rick-morris": {
    title: "Public Safety, Threat Assessment & Justice with Rick Morris",
    deck: "Former West Palm Beach Deputy Police Chief Rick Morris draws on four decades in law enforcement to discuss investigations, threat assessment, private security and the justice system."
  },
  "josh-smith": {
    title: "Faith, Food & Entrepreneurship: Josh Smith’s Divine Path",
    deck: "Palm Beach entrepreneur Josh Smith shares how a message from God clarified his path to Made Little Foodies Florida, Made You Hungry and purpose-driven work."
  },
  "michael-castellano": {
    title: "Human-Centered AI & the Future of Customer Engagement",
    deck: "Engajer founder Michael Castellano explains how conversational AI, interactive video and the avatar James are reshaping sales, marketing and customer communication."
  },
  "matthew-yeandle": {
    title: "Beauty & the Lens: Photography, Art & Creative Direction",
    deck: "Creative director, photographer and Emmy Award-winning hair artist Matthew Yeandle discusses classic beauty, visual storytelling and building a polished creative vision across mediums.",
    categories: ["Business"]
  },
  "john-rourke": {
    title: "Service Before Self: Make America Clean Again & We Fund the Blue",
    deck: "Army veteran and founder John Rourke discusses community cleanups, support for law enforcement and the military, and the service-first missions behind MACA and We Fund the Blue."
  },
  "matthew-yeandle-2": {
    title: "The Art of Transformation: Hair, Makeup & Photography with Matthew Yeandle",
    deck: "Matthew Yeandle traces how Emmy-winning hair artistry, makeup, wig design and published photography come together across print, television, music, film and celebrity work."
  },
  "john-rourke-2": {
    title: "At the Border in Eagle Pass: Cleanup, Community & Service",
    deck: "In this 2022 conversation, Army veteran and Blue Line Moving owner John Rourke shares a firsthand account from Eagle Pass and his wider work in community cleanup."
  },
  "elijah-knight": {
    title: "A Marine Sergeant’s Story of Service, Leadership & What Comes Next",
    deck: "In this 2022 conversation, Marine Sergeant Elijah Knight reflects on his military experience, awards, advice and plans for the future.",
    categories: ["Leadership", "Public Service"]
  }
};

function decodeEntities(value = "") {
  const named = {
    amp: "&",
    apos: "'",
    gt: ">",
    hellip: "…",
    ldquo: "“",
    lsquo: "‘",
    lt: "<",
    nbsp: " ",
    quot: '"',
    rdquo: "”",
    rsquo: "’"
  };
  return String(value).replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (match, entity) => {
    if (entity.startsWith("#x")) return String.fromCodePoint(Number.parseInt(entity.slice(2), 16));
    if (entity.startsWith("#")) return String.fromCodePoint(Number.parseInt(entity.slice(1), 10));
    return named[entity.toLowerCase()] ?? match;
  });
}

function matchContent(source, pattern) {
  return decodeEntities(source.match(pattern)?.[1] || "").replace(/\s+/g, " ").trim();
}

function durationSeconds(value = "") {
  const match = String(value).match(/^P(?:(\d+)D)?T(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/);
  if (!match) return 0;
  return Number(match[1] || 0) * 86400 + Number(match[2] || 0) * 3600 + Number(match[3] || 0) * 60 + Number(match[4] || 0);
}

function staticTopics(source = "") {
  const section = source.match(/<section\b[^>]*data-static-episode-topics\b[^>]*>[\s\S]*?<\/section>/)?.[0] || "";
  return [...section.matchAll(/<a\b[^>]*href="\/topics\/[^"]+\/"[^>]*>([\s\S]*?)<\/a>/g)]
    .map(match => decodeEntities(match[1].replace(/<[^>]+>/g, " ")).replace(/\s+/g, " ").trim())
    .filter(Boolean);
}

function chapterRows(description = "") {
  const rows = [];
  const pattern = /(?:^|\n)\s*((?:\d{1,2}:)?\d{1,2}:\d{2})\s+([^\n]{3,100})/g;
  for (const match of description.matchAll(pattern)) {
    const parts = match[1].split(":").map(Number);
    const startSeconds = parts.length === 3
      ? parts[0] * 3600 + parts[1] * 60 + parts[2]
      : parts[0] * 60 + parts[1];
    rows.push({ startSeconds, label: match[2].trim() });
  }
  return rows;
}

const editorial = {};
const directories = fs.readdirSync(EPISODES_DIR, { withFileTypes: true })
  .filter(entry => entry.isDirectory())
  .map(entry => entry.name)
  .sort();

for (const id of directories) {
  const htmlPath = path.join(EPISODES_DIR, id, "index.html");
  if (!fs.existsSync(htmlPath)) continue;
  const source = fs.readFileSync(htmlPath, "utf8");
  const structuredMatch = source.match(/<script id="detail-structured-data" type="application\/ld\+json">([\s\S]*?)<\/script>/);
  if (!structuredMatch) throw new Error(`Missing episode structured data: ${id}`);

  const structured = JSON.parse(structuredMatch[1]);
  const graph = Array.isArray(structured?.["@graph"]) ? structured["@graph"] : [];
  const video = graph.find(item => item?.["@type"] === "VideoObject");
  if (!video?.name || !video?.uploadDate) throw new Error(`Incomplete VideoObject: ${id}`);

  const title = matchContent(source, /<title>([\s\S]*?)<\/title>/).replace(/\s*\|\s*The Alana Show\s*$/i, "");
  const metaDescription = matchContent(source, /<meta name="description" content="([^"]*)"/);
  const description = String(video.description || "").replace(/\s+/g, " ").trim();
  const rawThumbnail = Array.isArray(video.thumbnailUrl) ? video.thumbnailUrl.find(Boolean) : video.thumbnailUrl;
  const thumbnail = normalizeThumbnailUrl(rawThumbnail);
  const categories = staticTopics(source);
  const chapters = chapterRows(String(video.description || ""));
  const override = EDITORIAL_OVERRIDES[id] || {};

  editorial[id] = {
    title: override.title || title || video.name,
    deck: override.deck || metaDescription,
    metaDescription,
    description,
    publishedAt: video.uploadDate,
    durationSeconds: durationSeconds(video.duration),
    thumbnail: thumbnail || "",
    categories: override.categories || categories,
    chapters
  };
}

const output = `// Generated from the verified metadata already published on each permanent episode page.\n// Run: node scripts/sync-episode-editorial.mjs\n\nexport const episodeEditorial = Object.freeze(${JSON.stringify(editorial, null, 2)});\n\nexport function editorialForEpisode(id) {\n  return episodeEditorial[id] || null;\n}\n`;

const previous = fs.existsSync(OUTPUT) ? fs.readFileSync(OUTPUT, "utf8") : "";
if (previous !== output) fs.writeFileSync(OUTPUT, output);
console.log(`Synced verified editorial metadata for ${Object.keys(editorial).length} episodes.`);
