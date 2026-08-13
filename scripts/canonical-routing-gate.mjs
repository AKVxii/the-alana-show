import fs from "node:fs";

const config = JSON.parse(fs.readFileSync("vercel.json", "utf8"));
const errors = [];
const fail = message => errors.push(message);

if (config.cleanUrls !== true) fail("cleanUrls must remain enabled.");
if (config.trailingSlash !== false) fail("trailingSlash must remain false for canonical clean URLs.");

const redirects = Array.isArray(config.redirects) ? config.redirects : [];
const rootIndex = redirects.find(rule => rule.source === "/index.html");
if (!rootIndex || rootIndex.destination !== "/" || rootIndex.permanent !== true) fail("/index.html must permanently redirect to /.");
const nestedIndex = redirects.find(rule => rule.source === "/:path*/index.html");
if (!nestedIndex || nestedIndex.destination !== "/:path*" || nestedIndex.permanent !== true) fail("Nested index.html routes must permanently redirect to clean paths.");

const packageJson = JSON.parse(fs.readFileSync("package.json", "utf8"));
if (!String(packageJson.scripts?.quality || "").includes("canonical-routing-gate.mjs")) fail("Canonical routing gate is not included in npm run quality.");

if (errors.length) {
  console.error(`Canonical routing gate failed with ${errors.length} issue${errors.length === 1 ? "" : "s"}:`);
  errors.forEach(error => console.error(`  - ${error}`));
  process.exit(1);
}

console.log("Canonical routing gate passed.");
