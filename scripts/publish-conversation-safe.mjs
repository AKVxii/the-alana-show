import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const ROOT = process.cwd();
const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const inputArg = args.find(arg => !arg.startsWith("--")) || "content/conversation.json";

function run(command, commandArgs, options = {}) {
  return spawnSync(command, commandArgs, {
    cwd: ROOT,
    stdio: "inherit",
    ...options
  });
}

function captureGitStatus() {
  const result = spawnSync("git", ["status", "--porcelain"], { cwd: ROOT, encoding: "utf8" });
  if (result.status !== 0) throw new Error("Unable to inspect Git working-tree state.");
  return result.stdout;
}

function rollback() {
  const status = captureGitStatus();
  const untracked = status
    .split(/\r?\n/)
    .filter(line => line.startsWith("?? "))
    .map(line => line.slice(3).trim())
    .filter(Boolean);

  spawnSync("git", ["restore", "--worktree", "--staged", "--", "."], {
    cwd: ROOT,
    stdio: "ignore"
  });

  for (const relative of untracked) {
    const absolute = path.resolve(ROOT, relative);
    if (!absolute.startsWith(`${ROOT}${path.sep}`)) continue;
    if (fs.existsSync(absolute)) fs.rmSync(absolute, { recursive: true, force: true });
  }
}

function abort(message) {
  if (!dryRun) {
    try {
      rollback();
      console.error("Publishing changes were rolled back to the clean starting state.");
    } catch (error) {
      console.error(`Automatic rollback could not complete: ${error.message}`);
    }
  }
  console.error(message);
  process.exit(1);
}

let initialStatus;
try {
  initialStatus = captureGitStatus();
} catch (error) {
  console.error(error.message);
  process.exit(1);
}
if (initialStatus.trim()) {
  console.error("Publish aborted: working tree is not clean. Commit, stash, or discard unrelated changes first.");
  process.exit(1);
}

const coreArgs = ["scripts/publish-conversation.mjs", ...args];
if (!dryRun && !coreArgs.includes("--skip-checks")) coreArgs.push("--skip-checks");
const core = run(process.execPath, coreArgs);
if (core.status !== 0) abort("Core conversation publishing failed.");
if (dryRun) process.exit(0);

const topics = run(process.execPath, ["scripts/apply-publishing-topics.mjs", inputArg]);
if (topics.status !== 0) abort("Editorial topic synchronization failed.");

const editorial = run(process.execPath, ["scripts/sync-episode-editorial.mjs"]);
if (editorial.status !== 0) abort("Episode editorial metadata resynchronization failed.");

const hubs = run(process.execPath, ["scripts/sync-hub-authority.mjs"]);
if (hubs.status !== 0) abort("Discovery-hub authority sync failed.");

const sitemap = run(process.execPath, ["scripts/sync-sitemap-freshness.mjs"]);
if (sitemap.status !== 0) abort("Sitemap freshness sync failed.");

const videoSitemap = run(process.execPath, ["scripts/sync-video-sitemap.mjs"]);
if (videoSitemap.status !== 0) abort("Video sitemap sync failed.");

const npm = process.platform === "win32" ? "npm.cmd" : "npm";
const quality = run(npm, ["run", "quality"]);
if (quality.status !== 0) abort("Repository quality checks failed.");

console.log("Conversation publishing complete: archive pages, editorial topics, discovery hubs, canonical sitemap freshness, video discovery, and quality gates are synchronized.");

const distribution = run(process.execPath, ["scripts/distribution-brief.mjs", inputArg]);
if (distribution.status !== 0) {
  console.warn("Publishing succeeded, but the optional distribution brief could not be generated. The repository changes remain valid.");
}
