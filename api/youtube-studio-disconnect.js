const {
  clearSession,
  json,
  readSession,
  revokeToken
} = require("./youtube-studio-lib");

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return json(res, 405, { error: "Method not allowed" });
  }

  const session = readSession(req);
  await revokeToken(session?.refreshToken || session?.accessToken || "");
  clearSession(res);
  return json(res, 200, { disconnected: true });
};
