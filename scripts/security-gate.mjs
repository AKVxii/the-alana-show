import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const failures = [];
const fail = message => failures.push(message);
const read = relative => fs.readFileSync(path.join(ROOT, relative), "utf8");

function requireText(source, needle, label) {
  if (!source.includes(needle)) fail(`${label} is missing.`);
}

function walkClientFiles(relativeDir) {
  const base = path.join(ROOT, relativeDir);
  if (!fs.existsSync(base)) return [];
  const files = [];
  for (const entry of fs.readdirSync(base, { withFileTypes: true })) {
    const relative = path.join(relativeDir, entry.name);
    if (entry.isDirectory()) files.push(...walkClientFiles(relative));
    else if (/\.(?:js|mjs|html|css)$/i.test(entry.name)) files.push(relative);
  }
  return files;
}

let vercel;
try {
  vercel = JSON.parse(read("vercel.json"));
} catch (error) {
  fail(`vercel.json is invalid JSON: ${error.message}`);
  vercel = {};
}

const globalHeaders = vercel.headers?.find(rule => rule.source === "/(.*)")?.headers || [];
const headerMap = new Map(globalHeaders.map(header => [String(header.key).toLowerCase(), String(header.value)]));

for (const [key, expected] of [
  ["x-content-type-options", "nosniff"],
  ["referrer-policy", "strict-origin-when-cross-origin"],
  ["x-frame-options", "SAMEORIGIN"]
]) {
  if (headerMap.get(key) !== expected) fail(`Global ${key} header must be ${expected}.`);
}

const permissions = headerMap.get("permissions-policy") || "";
for (const directive of ["camera=()", "microphone=()", "geolocation=()"]) {
  if (!permissions.includes(directive)) fail(`Permissions-Policy must disable ${directive.split("=")[0]}.`);
}

const csp = headerMap.get("content-security-policy") || "";
for (const directive of ["frame-ancestors 'self'", "base-uri 'self'", "object-src 'none'", "form-action 'self'"]) {
  if (!csp.includes(directive)) fail(`Content-Security-Policy must include ${directive}.`);
}

const robots = headerMap.get("x-robots-tag") || "";
if (!robots.includes("max-image-preview:large") || !robots.includes("max-video-preview:-1")) {
  fail("Search preview permissions must remain enabled.");
}

const contact = read("api/contact.js");
requireText(contact, "sameOriginRequest", "Contact same-origin protection");
requireText(contact, 'res.setHeader("Cache-Control", "no-store")', "Contact no-store response policy");
requireText(contact, 'contentType.startsWith("application/json")', "Contact JSON-only request enforcement");
requireText(contact, "contentLength > 20000", "Contact request-size cap");
requireText(contact, "ALLOWED_INQUIRIES", "Contact inquiry allowlist");
requireText(contact, "new AbortController()", "Contact upstream timeout");
if (/console\.error\(\s*result\s*\)/.test(contact)) fail("Contact endpoint must not log raw provider payloads.");

const subscribe = read("api/subscribe.js");
requireText(subscribe, "sameOriginRequest", "Newsletter same-origin protection");
requireText(subscribe, 'res.setHeader("Cache-Control", "no-store")', "Newsletter no-store response policy");
requireText(subscribe, "company_website", "Newsletter honeypot");
requireText(subscribe, "new AbortController()", "Newsletter upstream timeout");

const youtube = read("api/youtube.js");
requireText(youtube, 'res.setHeader("Cache-Control", "no-store")', "YouTube failure no-store policy");
requireText(youtube, "new AbortController()", "YouTube upstream timeout");
if (/\bdetail\s*:/.test(youtube)) fail("YouTube public error responses must not expose upstream detail.");

const contactUi = read("src/components/Contact.js");
for (const bound of [
  'name="name" autocomplete="name" maxlength="120"',
  'name="email" type="email" autocomplete="email" maxlength="320"',
  'name="organization" autocomplete="organization" maxlength="160"',
  'name="phone" type="tel" autocomplete="tel" maxlength="80"',
  'name="website" type="text" inputmode="url" autocomplete="url" maxlength="500"',
  'textarea name="message" maxlength="8000"'
]) {
  if (!contactUi.includes(bound)) fail(`Contact UI bound is missing: ${bound}`);
}

const secretNames = ["RESEND_API_KEY", "KIT_API_KEY", "YOUTUBE_API_KEY", "CONTACT_TO_EMAIL", "CONTACT_FROM_EMAIL"];
for (const relative of walkClientFiles("src")) {
  const source = read(relative);
  for (const secret of secretNames) {
    if (source.includes(secret)) fail(`Server-only environment variable name ${secret} leaked into client source: ${relative}`);
  }
}

if (failures.length) {
  console.error("Security gate failed:");
  failures.forEach(message => console.error(`- ${message}`));
  process.exit(1);
}

console.log("Public surface security gate passed.");
console.log("  Browser trust boundaries, form/API abuse controls, provider error hygiene, and client secret separation: OK");
