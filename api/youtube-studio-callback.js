const {
  EXPECTED_CHANNEL_ID,
  clearSession,
  clearState,
  config,
  exchangeCode,
  ownedChannel,
  readState,
  revokeToken,
  securityHeaders,
  writeSession
} = require("./youtube-studio-lib");

function consoleRedirect(res, parameters = {}) {
  const url = new URL("https://thealanashow.com/studio-console");
  for (const [key, value] of Object.entries(parameters)) {
    if (value !== undefined && value !== null && value !== "") url.searchParams.set(key, String(value));
  }
  return res.redirect(302, url.toString());
}

module.exports = async function handler(req, res) {
  securityHeaders(res);
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return consoleRedirect(res, { error: "method" });
  }

  const current = config();
  if (!current.configured) return consoleRedirect(res, { setup: "required" });

  const error = String(req.query?.error || "").trim();
  if (error) {
    clearState(res);
    return consoleRedirect(res, { error: error === "access_denied" ? "cancelled" : "oauth" });
  }

  const code = String(req.query?.code || "").trim();
  const returnedState = String(req.query?.state || "").trim();
  const stored = readState(req);
  clearState(res);

  const stateIsFresh = stored?.createdAt && Date.now() - Number(stored.createdAt) < 10 * 60 * 1000;
  if (!code || !returnedState || !stored?.state || returnedState !== stored.state || !stored.verifier || !stateIsFresh) {
    clearSession(res);
    return consoleRedirect(res, { error: "state" });
  }

  try {
    const tokens = await exchangeCode({ code, verifier: stored.verifier });
    const channel = await ownedChannel(tokens.access_token);

    if (!channel || channel.id !== EXPECTED_CHANNEL_ID) {
      await revokeToken(tokens.refresh_token || tokens.access_token);
      clearSession(res);
      return consoleRedirect(res, { error: "wrong-channel" });
    }

    const expiresIn = Math.max(60, Number(tokens.expires_in || 3600));
    writeSession(res, {
      version: 1,
      channelId: channel.id,
      channelTitle: channel.snippet?.title || "The Alana Show",
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token || "",
      expiresAt: Date.now() + expiresIn * 1000,
      scope: tokens.scope || "",
      tokenType: tokens.token_type || "Bearer",
      connectedAt: Date.now()
    });

    return consoleRedirect(res, { connected: "1" });
  } catch (connectionError) {
    console.error("YouTube Studio OAuth callback failed", {
      name: connectionError?.name || "Error",
      message: connectionError?.message || "Unknown failure"
    });
    clearSession(res);
    return consoleRedirect(res, { error: "connection" });
  }
};
