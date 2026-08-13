import fs from "node:fs";

const errors = [];
const fail = message => errors.push(message);

const workflowPath = ".github/workflows/production-health.yml";
const scriptPath = "scripts/production-health.mjs";

if (!fs.existsSync(workflowPath)) fail("Production health workflow is missing.");
if (!fs.existsSync(scriptPath)) fail("Production health audit script is missing.");

if (fs.existsSync(workflowPath)) {
  const workflow = fs.readFileSync(workflowPath, "utf8");
  for (const required of [
    "schedule:",
    "workflow_dispatch:",
    "node scripts/production-health.mjs",
    "timeout-minutes: 12"
  ]) if (!workflow.includes(required)) fail(`Production health workflow is missing: ${required}`);
}

if (fs.existsSync(scriptPath)) {
  const script = fs.readFileSync(scriptPath, "utf8");
  for (const required of [
    "https://thealanashow.com",
    "/robots.txt",
    "/sitemap.xml",
    "/video-sitemap.xml",
    "/api/youtube",
    "youtube-nocookie.com/embed/",
    "VideoObject",
    "Verified episode"
  ]) if (!script.includes(required)) fail(`Production health audit is missing coverage for: ${required}`);
}

const packageJson = JSON.parse(fs.readFileSync("package.json", "utf8"));
if (packageJson.scripts?.["health:production"] !== "node scripts/production-health.mjs") fail("package.json is missing the health:production command.");
if (!String(packageJson.scripts?.quality || "").includes("production-health-gate.mjs")) fail("The production health regression gate is not included in npm run quality.");

if (errors.length) {
  console.error(`Production health gate failed with ${errors.length} issue${errors.length === 1 ? "" : "s"}:`);
  errors.forEach(error => console.error(`  - ${error}`));
  process.exit(1);
}

console.log("Production health gate passed.");
