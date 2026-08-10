import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

const ROOT = process.cwd();
const ORIGIN = "https://thealanashow.com";
const args = process.argv.slice(2);
const inputArg = args.find(arg => !arg.startsWith("--")) || "content/conversation.json";
const inputPath = path.resolve(ROOT, inputArg);

function fail(message) {
  console.error(`Distribution brief unavailable: ${message}`);
  process.exit(1);
}

if (!fs.existsSync(inputPath)) fail(`input file not found: ${inputArg}`);

let input;
try {
  input = JSON.parse(fs.readFileSync(inputPath, "utf8"));
} catch (error) {
  fail(`input JSON could not be parsed: ${error.message}`);
}

const videoId = String(input.videoId || "").trim();
if (!videoId) fail("videoId is required.");

const catalogUrl = pathToFileURL(path.join(ROOT, "src/data/catalog.js")).href;
const { episodes, guests } = await import(catalogUrl);
const episode = episodes.find(candidate => candidate.videoId === videoId);
if (!episode) fail(`published catalog entry was not found for YouTube video ${videoId}.`);

const guestById = new Map(guests.map(guest => [guest.id, guest]));
const relatedGuests = (episode.guestIds || []).map(id => guestById.get(id)).filter(Boolean);
const canonicalEpisode = `${ORIGIN}/episodes/${episode.id}`;
const youtubeUrl = `https://www.youtube.com/watch?v=${encodeURIComponent(videoId)}`;
const guestProfiles = relatedGuests.map(guest => ({
  name: guest.name,
  url: `${ORIGIN}/guests/${guest.id}`
}));

const output = [];
output.push("");
output.push("THE ALANA SHOW — POST-PUBLISH DISTRIBUTION BRIEF");
output.push("=================================================");
output.push(`Conversation: ${episode.title}`);
output.push(`Canonical episode: ${canonicalEpisode}`);
output.push(`YouTube: ${youtubeUrl}`);
if (guestProfiles.length) {
  output.push("Guest profiles:");
  guestProfiles.forEach(guest => output.push(`  - ${guest.name}: ${guest.url}`));
}
output.push("");
output.push("YOUTUBE DESCRIPTION LINK");
output.push(`More from The Alana Show: ${canonicalEpisode}`);
output.push("");
output.push("GUEST / ORGANIZATION SHARE LINK");
output.push(`Permanent conversation page: ${canonicalEpisode}`);
output.push("");
output.push("POST-PUBLISH CHECKLIST");
output.push(`  [ ] Add ${canonicalEpisode} near the top of the YouTube description.`);
output.push("  [ ] Send the permanent conversation page—not a temporary social/search URL—to each guest and relevant organization.");
output.push("  [ ] When appropriate, ask the guest or organization to link to the permanent conversation page from an official website, newsroom, bio, event recap, or resources page.");
output.push("  [ ] Use the episode page's Share conversation control for social, text, email, and timestamp-specific sharing.");
output.push(`  [ ] For media references or approved brand assets, use ${ORIGIN}/press.`);
output.push("  [ ] Keep the website page as the canonical owned destination even when promoting YouTube, Apple Podcasts, Spotify, or radio listening.");
output.push("");
output.push("LINKING PRINCIPLE");
output.push("External platforms distribute the conversation. The permanent The Alana Show page owns the context, guest relationship, topic links, search authority, and long-term reference URL.");
output.push("");

console.log(output.join("\n"));
