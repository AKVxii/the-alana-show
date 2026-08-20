const crypto = require("node:crypto");

const EXPECTED_CHANNEL_ID = process.env.YOUTUBE_STUDIO_CHANNEL_ID || "UC8sZK_EKbcuCBMquG_C30Sw";
const DEFAULT_REDIRECT_URI = "https://thealanashow.com/api/youtube-studio-callback";
const SESSION_COOKIE = "__Host-tas_youtube_studio";
const STATE_COOKIE = "__Host-tas_youtube_studio_state";
const READ_ONLY_SCOPES = Object.freeze([
  "https://www.googleapis.com/auth/youtube.readonly",
  "https://www.googleapis.com/auth/yt-analytics.readonly"
]);

function config() {
  const clientId = String(process.env.YOUTUBE_STUDIO_CLIENT_ID || "").trim();
  const clientSecret = String(process.env.YOUTUBE_STUDIO_CLIENT_SECRET || "").trim();
  const sessionSecret = String(process.env.YOUTUBE_STUDIO_SESSION_SECRET || "").trim();
  const redirectUri = String(process.env.YOUTUBE_STUDIO_REDIRECT_URI || DEFAULT_REDIRECT_URI).trim();
  const configured = Boolean(clientId && clientSecret && sessionSecret.length >= 32 && redirectUri);
  return {
    configured,
    clientId,
    clientSecret,
    sessionSecret,
    redirectUri,
    expectedChannelId: EXPECTED_CHANNEL_ID,
    scopes: [...READ_ONLY_SCOPES]
  };
}

function securityHeaders(res) {
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Robots-Tag", "noindex, nofollow, noarchive");
}

function json(res, status, payload) {
  securityHeaders(res);
  return res.status(status).json(payload);
}

function parseCookies(req) {
  const header = String(req.headers?.cookie || "");
  const cookies = {};
  for (const pair of header.split(";")) {
    const index = pair.indexOf("=");
    if (index < 0) continue;
    const name = pair.slice(0, index).trim();
    const value = pair.slice(index + 1).trim();
    if (!name) continue;
    try {
      cookies[name] = decodeURIComponent(value);
    } catch {
      cookies[name] = value;
    }
  }
  return cookies;
}

function appendSetCookie(res, value) {
  const existing = res.getHeader("Set-Cookie");
  if (!existing) {
    res.setHeader("Set-Cookie", value);
    return;
  }
  res.setHeader("Set-Cookie", Array.isArray(existing) ? [...existing, value] : [existing, value]);
}

function cookie(name, value, { maxAge = 0 } = {}) {
  const parts = [
    `${name}=${encodeURIComponent(value)}`,
    "Path=/",
    "HttpOnly",
    "Secure",
    "SameSite=Lax"
  ];
  if (maxAge > 0) parts.push(`Max-Age=${Math.floor(maxAge)}`);
  else parts.push("Max-Age=0", "Expires=Thu, 01 Jan 1970 00:00:00 GMT");
  return parts.join("; ");
}

function keyFor(secret) {
  return crypto.createHash("sha256").update(secret, "utf8").digest();
}

function seal(payload, secret = config().sessionSecret) {
  if (!secret || secret.length < 32) throw new Error("YouTube Studio session secret is not configured.");
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", keyFor(secret), iv);
  const plaintext = Buffer.from(JSON.stringify(payload), "utf8");
  const encrypted = Buffer.concat([cipher.update(plaintext), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, encrypted]).toString("base64url");
}

function open(token, secret = config().sessionSecret) {
  if (!token || !secret || secret.length < 32) return null;
  try {
    const buffer = Buffer.from(token, "base64url");
    if (buffer.length < 29) return null;
    const iv = buffer.subarray(0, 12);
    const tag = buffer.subarray(12, 28);
    const encrypted = buffer.subarray(28);
    const decipher = crypto.createDecipheriv("aes-256-gcm", keyFor(secret), iv);
    decipher.setAuthTag(tag);
    const plaintext = Buffer.concat([decipher.update(encrypted), decipher.final()]);
    return JSON.parse(plaintext.toString("utf8"));
  } catch {
    return null;
  }
}

function writeState(res, payload) {
  appendSetCookie(res, cookie(STATE_COOKIE, seal(payload), { maxAge: 10 * 60 }));
}

function readState(req) {
  return open(parseCookies(req)[STATE_COOKIE]);
}

function clearState(res) {
  appendSetCookie(res, cookie(STATE_COOKIE, ""));
}

function writeSession(res, payload) {
  appendSetCookie(res, cookie(SESSION_COOKIE, seal(payload), { maxAge: 30 * 24 * 60 * 60 }));
}

function readSession(req) {
  return open(parseCookies(req)[SESSION_COOKIE]);
}

function clearSession(res) {
  appendSetCookie(res, cookie(SESSION_COOKIE, ""));
}

function base64Url(buffer) {
  return Buffer.from(buffer).toString("base64url");
}

function createOauthState() {
  const state = base64Url(crypto.randomBytes(32));
  const verifier = base64Url(crypto.randomBytes(64));
  const challenge = base64Url(crypto.createHash("sha256").update(verifier).digest());
  return { state, verifier, challenge, createdAt: Date.now() };
}

async function tokenRequest(params) {
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams(params)
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    const reason = body.error_description || body.error || `HTTP ${response.status}`;
    throw new Error(`Google token request failed: ${reason}`);
  }
  return body;
}

async function exchangeCode({ code, verifier }) {
  const current = config();
  return tokenRequest({
    client_id: current.clientId,
    client_secret: current.clientSecret,
    redirect_uri: current.redirectUri,
    grant_type: "authorization_code",
    code,
    code_verifier: verifier
  });
}

async function refreshSession(session) {
  if (!session?.refreshToken) throw new Error("The Google authorization has expired. Reconnect the channel.");
  const current = config();
  const tokens = await tokenRequest({
    client_id: current.clientId,
    client_secret: current.clientSecret,
    grant_type: "refresh_token",
    refresh_token: session.refreshToken
  });
  return {
    ...session,
    accessToken: tokens.access_token,
    expiresAt: Date.now() + Math.max(60, Number(tokens.expires_in || 3600)) * 1000,
    scope: tokens.scope || session.scope,
    tokenType: tokens.token_type || session.tokenType || "Bearer",
    refreshedAt: Date.now()
  };
}

async function activeSession(req, res) {
  let session = readSession(req);
  if (!session?.accessToken) return null;
  if (Number(session.expiresAt || 0) <= Date.now() + 90_000) {
    session = await refreshSession(session);
    writeSession(res, session);
  }
  return session;
}

async function googleJson(url, accessToken, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${accessToken}`,
      ...(options.headers || {})
    }
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    const reason = body.error?.message || body.error_description || body.error || `HTTP ${response.status}`;
    const error = new Error(`Google API request failed: ${reason}`);
    error.status = response.status;
    throw error;
  }
  return body;
}

async function ownedChannel(accessToken) {
  const url = new URL("https://www.googleapis.com/youtube/v3/channels");
  url.search = new URLSearchParams({
    part: "id,snippet,statistics,contentDetails,status",
    mine: "true"
  });
  const data = await googleJson(url, accessToken);
  const expected = data.items?.find(item => item.id === EXPECTED_CHANNEL_ID);
  return expected || data.items?.[0] || null;
}

async function revokeToken(token) {
  if (!token) return;
  try {
    await fetch("https://oauth2.googleapis.com/revoke", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ token })
    });
  } catch {
    // Local sign-out still succeeds if Google is temporarily unavailable.
  }
}

function normalizeTitle(value = "") {
  return String(value)
    .toLowerCase()
    .replace(/\s*\|\s*the alana show\s*$/i, "")
    .replace(/&amp;|&/g, " and ")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function parseDuration(value = "PT0S") {
  const match = String(value).match(/P(?:(\d+)D)?T?(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return 0;
  return Number(match[1] || 0) * 86400 + Number(match[2] || 0) * 3600 + Number(match[3] || 0) * 60 + Number(match[4] || 0);
}

function dateOnly(date = new Date()) {
  return new Date(date).toISOString().slice(0, 10);
}

function yesterday() {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() - 1);
  return dateOnly(date);
}

function publicConfig() {
  const current = config();
  return {
    configured: current.configured,
    redirectUri: current.redirectUri,
    expectedChannelId: current.expectedChannelId,
    readOnlyScopes: current.scopes
  };
}

module.exports = function handler(req, res) {
  return json(res, 404, { error: "Not found" });
};

Object.assign(module.exports, {
  EXPECTED_CHANNEL_ID,
  READ_ONLY_SCOPES,
  SESSION_COOKIE,
  STATE_COOKIE,
  activeSession,
  appendSetCookie,
  clearSession,
  clearState,
  config,
  createOauthState,
  dateOnly,
  exchangeCode,
  googleJson,
  json,
  normalizeTitle,
  open,
  ownedChannel,
  parseCookies,
  parseDuration,
  publicConfig,
  readSession,
  readState,
  refreshSession,
  revokeToken,
  seal,
  securityHeaders,
  writeSession,
  writeState,
  yesterday
});
