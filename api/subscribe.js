function validEmail(value = "") {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value).trim());
}

function cleanName(value = "") {
  return String(value).replace(/[<>\r\n]/g, " ").replace(/\s+/g, " ").trim().slice(0, 80);
}

function sameOriginRequest(req) {
  const origin = req.headers.origin;
  const host = req.headers.host;
  if (!origin || !host) return true;
  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}

module.exports = async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");

  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  if (!sameOriginRequest(req)) {
    return res.status(403).json({ error: "Request not allowed" });
  }

  const { first_name = "", email = "", company_website = "" } = req.body || {};

  // Honeypot: silently accept obvious bot submissions without sending them to Kit.
  if (company_website) return res.status(200).json({ ok: true });

  const emailAddress = String(email).trim().toLowerCase();
  const firstName = cleanName(first_name);

  if (!validEmail(emailAddress)) {
    return res.status(400).json({ error: "Enter a valid email address" });
  }

  const apiKey = process.env.KIT_API_KEY;
  if (!apiKey) {
    return res.status(503).json({ error: "Email signup is temporarily unavailable" });
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);

  try {
    const response = await fetch("https://api.kit.com/v4/subscribers", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Kit-Api-Key": apiKey
      },
      body: JSON.stringify({
        email_address: emailAddress,
        ...(firstName ? { first_name: firstName } : {}),
        state: "active"
      }),
      signal: controller.signal
    });

    let result = {};
    try {
      result = await response.json();
    } catch {
      result = {};
    }

    if (!response.ok) {
      console.error("Kit subscriber request failed", {
        status: response.status,
        code: result?.error || result?.errors?.[0]?.code || "unknown"
      });
      return res.status(502).json({ error: "Unable to complete signup right now" });
    }

    return res.status(200).json({ ok: true });
  } catch (error) {
    console.error("Kit subscriber request failed", {
      name: error?.name || "Error"
    });
    return res.status(502).json({ error: "Unable to complete signup right now" });
  } finally {
    clearTimeout(timeout);
  }
};
