import fs from "node:fs";

const errors = [];
const read = file => {
  if (!fs.existsSync(file)) {
    errors.push(`Missing required file: ${file}`);
    return "";
  }
  return fs.readFileSync(file, "utf8");
};

const page = read("studio-console/index.html");
const client = read("src/studio-console.js");
const styles = read("src/studio-console.css");
const lib = read("api/youtube-studio-lib.js");
const auth = read("api/youtube-studio-auth.js");
const callback = read("api/youtube-studio-callback.js");
const session = read("api/youtube-studio-session.js");
const audit = read("api/youtube-studio-audit.js");
const disconnect = read("api/youtube-studio-disconnect.js");
const proposals = read("studio-console/thumbnail-proposals.json");
const robots = read("robots.txt");
const vercel = read("vercel.json");
const packageJson = read("package.json");

for (const needle of [
  'meta name="robots" content="noindex,nofollow,noarchive,nosnippet"',
  "READ-ONLY",
  "Every photo approved individually",
  "No automatic publishing",
  "No deletions",
  "No visibility changes",
  "data-thumbnail-dialog"
]) {
  if (!page.includes(needle)) errors.push(`Private Studio page is missing: ${needle}`);
}

for (const needle of [
  'https://www.googleapis.com/auth/youtube.readonly',
  'https://www.googleapis.com/auth/yt-analytics.readonly',
  'UC8sZK_EKbcuCBMquG_C30Sw',
  'aes-256-gcm',
  '__Host-tas_youtube_studio',
  'YOUTUBE_STUDIO_CLIENT_SECRET',
  'YOUTUBE_STUDIO_SESSION_SECRET'
]) {
  if (!lib.includes(needle)) errors.push(`OAuth/session safeguard is missing: ${needle}`);
}

for (const forbidden of [
  'https://www.googleapis.com/auth/youtube.force-ssl',
  'https://www.googleapis.com/auth/youtube.upload',
  'https://www.googleapis.com/auth/youtube"',
  '/thumbnails/set',
  'videos.update',
  'videos.delete',
  'captions.update'
]) {
  if ([lib, auth, callback, session, audit, disconnect, client].some(source => source.includes(forbidden))) {
    errors.push(`Read-only phase must not include write capability: ${forbidden}`);
  }
}

for (const needle of [
  'access_type: "offline"',
  'include_granted_scopes: "true"',
  'code_challenge_method: "S256"',
  'writeState(res, oauth)'
]) {
  if (!auth.includes(needle)) errors.push(`OAuth start endpoint is missing: ${needle}`);
}

for (const needle of [
  'returnedState !== stored.state',
  'channel.id !== EXPECTED_CHANNEL_ID',
  'writeSession(res',
  'clearSession(res)'
]) {
  if (!callback.includes(needle)) errors.push(`OAuth callback safeguard is missing: ${needle}`);
}

for (const needle of [
  'mode: "read-only"',
  'canWrite: false',
  'photoApprovalRequired: true',
  'privacyStatus',
  'Potential duplicate group',
  'Studio-only drafts',
  'Thumbnail impressions and impressions click-through rate are not exposed'
]) {
  if (!audit.includes(needle)) errors.push(`Read-only audit safeguard is missing: ${needle}`);
}

for (const needle of [
  'tas-thumbnail-decisions-v1',
  'canApplyToYouTube: false',
  'No click in this window changes YouTube',
  'AI face alteration:',
  'faceAltered === false',
  'data-clear-decision'
]) {
  if (!client.includes(needle)) errors.push(`Photo approval safeguard is missing: ${needle}`);
}

for (const needle of [
  '.thumbnail-mobile-preview',
  '.photo-badge',
  '@media (max-width: 720px)',
  '@media (prefers-reduced-motion: reduce)'
]) {
  if (!styles.includes(needle)) errors.push(`Studio console styling is missing: ${needle}`);
}

if (!proposals.includes('"videos": {}')) errors.push("Thumbnail proposal registry must begin empty and owner-controlled.");
if (!robots.includes("Disallow: /studio-console") || !robots.includes("Disallow: /api/youtube-studio")) {
  errors.push("Robots rules must exclude the private Studio console and endpoints.");
}
if (!vercel.includes('"source": "/studio-console"') || !vercel.includes('"noindex, nofollow, noarchive, nosnippet"')) {
  errors.push("Vercel headers must prevent indexing and caching of the private console.");
}
if (!packageJson.includes("youtube-studio-console-gate.mjs")) {
  errors.push("YouTube Studio console regression gate must run in npm run quality.");
}

if (errors.length) {
  console.error(`YouTube Studio console gate failed with ${errors.length} issue${errors.length === 1 ? "" : "s"}:`);
  errors.forEach(error => console.error(`  - ${error}`));
  process.exit(1);
}

console.log("YouTube Studio console gate passed.");
console.log("  Read-only OAuth, fixed channel identity, encrypted session, individual photo approval and no-write boundary: OK");
