import fs from "node:fs";
import { spawnSync } from "node:child_process";

const errors = [];
const KEY = "d6de9758dfaf587648bb523027de210b";
const keyFile = `${KEY}.txt`;
const scriptPath = "scripts/indexnow-submit.mjs";
const workflowPath = ".github/workflows/indexnow-discovery.yml";
const assert = (condition, message) => { if (!condition) errors.push(message); };
const read = path => fs.existsSync(path) ? fs.readFileSync(path, "utf8") : "";

const key = read(keyFile).trim();
const script = read(scriptPath);
const workflow = read(workflowPath);

assert(key === KEY, "IndexNow root ownership key file is missing or incorrect.");
assert(script.includes('const ORIGIN = "https://thealanashow.com"'), "IndexNow submitter must be locked to the canonical production origin.");
assert(script.includes('https://api.indexnow.org/indexnow'), "IndexNow submitter must use the protocol global endpoint.");
assert(script.includes(`const KEY = "${KEY}"`), "IndexNow submitter must use the published ownership key.");
assert(script.includes("keyLocation"), "IndexNow bulk submission must declare the root key location.");
assert(script.includes("MAX_URLS = 10_000"), "IndexNow submitter must preserve the protocol URL batch cap.");
assert(script.includes("INDEXNOW_DRY_RUN"), "IndexNow submitter must support network-free CI validation.");
assert(script.includes("url.origin !== ORIGIN"), "IndexNow submitter must reject URLs outside the canonical production origin.");

assert(workflow.includes("name: IndexNow discovery"), "IndexNow production workflow is missing.");
assert(workflow.includes("push:"), "IndexNow automation must run after production pushes.");
assert(workflow.includes("- main"), "IndexNow automation must be restricted to the main production branch.");
assert(workflow.includes("fetch-depth: 0"), "IndexNow workflow must fetch enough Git history to detect changed pages safely.");
assert(workflow.includes("sleep 75"), "IndexNow workflow must leave a deployment-settle window before notifying crawlers.");
assert(workflow.includes("INDEXNOW_BEFORE_SHA"), "IndexNow workflow must pass the previous production commit.");
assert(workflow.includes("INDEXNOW_AFTER_SHA"), "IndexNow workflow must pass the deployed production commit.");

if (script && fs.existsSync(scriptPath)) {
  const dryRun = spawnSync(process.execPath, [scriptPath], {
    encoding: "utf8",
    env: {
      ...process.env,
      INDEXNOW_DRY_RUN: "1",
      INDEXNOW_URLS: "https://thealanashow.com/episodes/example,https://example.com/should-be-rejected"
    }
  });
  assert(dryRun.status === 0, `IndexNow dry run failed: ${dryRun.stderr || dryRun.stdout}`);
  assert(dryRun.stdout.includes("1 URL ready"), "IndexNow dry run must retain only canonical-host URLs.");
  assert(dryRun.stdout.includes("https://thealanashow.com/episodes/example"), "IndexNow dry run must preserve the canonical changed URL.");
  assert(!dryRun.stdout.includes("example.com/should-be-rejected"), "IndexNow dry run must not submit third-party URLs.");
}

if (errors.length) {
  console.error(`\nIndexNow discovery gate failed with ${errors.length} issue${errors.length === 1 ? "" : "s"}:\n`);
  errors.forEach(error => console.error(`  - ${error}`));
  process.exit(1);
}

console.log("IndexNow discovery gate passed.");
console.log("  Canonical-host ownership key: OK");
console.log("  Changed-page detection and URL scoping: OK");
console.log("  Production-only post-deploy automation: OK");
console.log("  Network-free dry-run validation: OK");
