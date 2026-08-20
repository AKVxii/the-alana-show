const {
  READ_ONLY_SCOPES,
  config,
  createOauthState,
  json,
  securityHeaders,
  writeState
} = require("./youtube-studio-lib");

module.exports = async function handler(req, res) {
  securityHeaders(res);
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return json(res, 405, { error: "Method not allowed" });
  }

  const current = config();
  if (!current.configured) {
    return res.redirect(302, "/studio-console?setup=required");
  }

  const oauth = createOauthState();
  writeState(res, oauth);

  const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  url.search = new URLSearchParams({
    client_id: current.clientId,
    redirect_uri: current.redirectUri,
    response_type: "code",
    scope: READ_ONLY_SCOPES.join(" "),
    access_type: "offline",
    include_granted_scopes: "true",
    prompt: "consent",
    state: oauth.state,
    code_challenge: oauth.challenge,
    code_challenge_method: "S256"
  });

  return res.redirect(302, url.toString());
};
