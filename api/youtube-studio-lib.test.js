const assert = require("node:assert/strict");
const test = require("node:test");
const {
  EXPECTED_CHANNEL_ID,
  normalizeTitle,
  open,
  parseDuration,
  seal
} = require("./youtube-studio-lib");

const TEST_SECRET = "test-only-youtube-studio-session-secret-1234567890";

test("the console is pinned to The Alana Show channel", () => {
  assert.equal(EXPECTED_CHANNEL_ID, "UC8sZK_EKbcuCBMquG_C30Sw");
});

test("encrypted session payloads round-trip and reject tampering", () => {
  const payload = {
    channelId: EXPECTED_CHANNEL_ID,
    accessToken: "access-token",
    refreshToken: "refresh-token",
    expiresAt: 123456789
  };
  const token = seal(payload, TEST_SECRET);
  assert.deepEqual(open(token, TEST_SECRET), payload);
  const tampered = `${token.slice(0, -1)}${token.endsWith("A") ? "B" : "A"}`;
  assert.equal(open(tampered, TEST_SECRET), null);
});

test("replacement and private duplicate titles normalize consistently", () => {
  assert.equal(
    normalizeTitle("Former U.S. Senator George LeMieux | Leadership, Public Service & Florida’s Future | The Alana Show"),
    normalizeTitle("Former U.S. Senator George LeMieux — Leadership, Public Service & Florida’s Future")
  );
});

test("ISO 8601 video durations are converted to seconds", () => {
  assert.equal(parseDuration("PT31M21S"), 1881);
  assert.equal(parseDuration("PT1H2M3S"), 3723);
});
