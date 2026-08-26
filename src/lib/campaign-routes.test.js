import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const read = relativePath => fs.readFileSync(new URL(`../../${relativePath}`, import.meta.url), "utf8");

function redirectMap() {
  const config = JSON.parse(read("vercel.json"));
  return new Map((config.redirects || []).map(route => [route.source, route]));
}

test("George LeMieux campaign links redirect to the canonical episode with fixed attribution", () => {
  const routes = redirectMap();
  assert.deepEqual(routes.get("/george"), {
    source: "/george",
    destination: "/episodes/george-lemieux",
    permanent: true
  });
  assert.equal(
    routes.get("/george-radio")?.destination,
    "/episodes/george-lemieux?utm_source=radio&utm_medium=broadcast&utm_campaign=george_lemieux_episode"
  );
  assert.equal(
    routes.get("/george-social")?.destination,
    "/episodes/george-lemieux?utm_source=social&utm_medium=organic&utm_campaign=george_lemieux_episode"
  );
  assert.equal(
    routes.get("/george-guest")?.destination,
    "/episodes/george-lemieux?utm_source=guest&utm_medium=referral&utm_campaign=george_lemieux_episode"
  );
  assert.equal(
    routes.get("/george-email")?.destination,
    "/episodes/george-lemieux?utm_source=email&utm_medium=outreach&utm_campaign=george_lemieux_episode"
  );
});

test("campaign measurement and episode promotion are wired into the public entry points", () => {
  const homeEntry = read("src/home-entry.js");
  const mediaHeader = read("src/components/MediaHeader.js");
  assert.match(homeEntry, /setupCampaignMeasurement\(\)/);
  assert.match(mediaHeader, /setupCampaignMeasurement\(\)/);
  assert.match(mediaHeader, /setupEpisodePromotion\(\)/);
});
