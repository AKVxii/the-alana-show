const {
  activeSession,
  clearSession,
  json,
  ownedChannel,
  publicConfig
} = require("./youtube-studio-lib");

module.exports = async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return json(res, 405, { error: "Method not allowed" });
  }

  const setup = publicConfig();
  if (!setup.configured) {
    return json(res, 200, {
      ...setup,
      connected: false,
      readOnly: true,
      canWrite: false
    });
  }

  try {
    const session = await activeSession(req, res);
    if (!session) {
      return json(res, 200, {
        ...setup,
        connected: false,
        readOnly: true,
        canWrite: false
      });
    }

    const channel = await ownedChannel(session.accessToken);
    if (!channel || channel.id !== setup.expectedChannelId) {
      clearSession(res);
      return json(res, 403, {
        ...setup,
        connected: false,
        readOnly: true,
        canWrite: false,
        error: "The connected Google account does not control Alana — All Over the Place channel."
      });
    }

    return json(res, 200, {
      ...setup,
      connected: true,
      readOnly: true,
      canWrite: false,
      connectedAt: session.connectedAt || null,
      scopes: String(session.scope || "").split(/\s+/).filter(Boolean),
      channel: {
        id: channel.id,
        title: channel.snippet?.title || "Alana — All Over the Place",
        customUrl: channel.snippet?.customUrl || "@alanakvandeveer",
        description: channel.snippet?.description || "",
        publishedAt: channel.snippet?.publishedAt || "",
        thumbnail: channel.snippet?.thumbnails?.high?.url || channel.snippet?.thumbnails?.default?.url || "",
        subscriberCount: Number(channel.statistics?.subscriberCount || 0),
        videoCount: Number(channel.statistics?.videoCount || 0),
        viewCount: Number(channel.statistics?.viewCount || 0)
      }
    });
  } catch (error) {
    console.error("YouTube Studio session check failed", {
      name: error?.name || "Error",
      message: error?.message || "Unknown failure"
    });
    clearSession(res);
    return json(res, 200, {
      ...setup,
      connected: false,
      readOnly: true,
      canWrite: false,
      reconnectRequired: true
    });
  }
};
