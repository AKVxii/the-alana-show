const KIT_FORM_ID = 9780619;

function validEmail(value = "") {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value).trim());
}

function cleanName(value = "") {
  return String(value).replace(/[<>\r\n]/g, " ").replace(/\s+/g, " ").trim().slice(0, 80);
}

function sameOriginRequest(req) {
  const origin = req.headers.origin;
  const forwardedHost = req.headers["x-forwarded-host"];
  const host = String(forwardedHost || req.headers.host || "").split(",")[0].trim();
  const forwardedProto = String(req.headers["x-forwarded-proto"] || "https").split(",")[0].trim().toLowerCase();

  // This endpoint is called only by first-party browser JavaScript, so a
  // missing Origin is rejected rather than treated as implicitly trusted.
  if (!origin || !host || !["https", "http"].includes(forwardedProto)) return false;

  try {
    const requestOrigin = new URL(origin).origin;
    const expectedOrigin = `${forwardedProto}://${host}`;
    return requestOrigin === expectedOrigin;
  } catch {
    return false;
  }
}

async function jsonOrEmpty(response) {
  try {
    return await response.json();
  } catch {
    return {};
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
    // Upsert the subscriber first. New subscribers remain inactive until they
    // confirm through the Kit form below; existing subscribers keep their
    // current state because Kit does not change state on an upsert.
    const subscriberResponse = await fetch("https://api.kit.com/v4/subscribers", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Kit-Api-Key": apiKey
      },
      body: JSON.stringify({
        email_address: emailAddress,
        ...(firstName ? { first_name: firstName } : {}),
        state: "inactive"
      }),
      signal: controller.signal
    });

    const subscriberResult = await jsonOrEmpty(subscriberResponse);

    if (!subscriberResponse.ok) {
      console.error("Kit subscriber request failed", {
        status: subscriberResponse.status,
        code: subscriberResult?.error || subscriberResult?.errors?.[0]?.code || subscriberResult?.errors?.[0] || "unknown"
      });
      return res.status(502).json({ error: "Unable to complete signup right now" });
    }

    const subscriberId = subscriberResult?.subscriber?.id;
    if (!subscriberId) {
      console.error("Kit subscriber request returned no subscriber id");
      return res.status(502).json({ error: "Unable to complete signup right now" });
    }

    // Add the subscriber to Alana — All Over the Place — Website Subscribers form.
    // When confirmation email is enabled and auto-confirm is disabled in Kit,
    // this form assignment triggers the double-opt-in confirmation flow.
    const formResponse = await fetch(`https://api.kit.com/v4/forms/${KIT_FORM_ID}/subscribers/${subscriberId}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Kit-Api-Key": apiKey
      },
      body: JSON.stringify({
        referrer: String(req.headers.origin || "https://thealanashow.com/").slice(0, 2048)
      }),
      signal: controller.signal
    });

    const formResult = await jsonOrEmpty(formResponse);

    if (!formResponse.ok) {
      console.error("Kit form subscription request failed", {
        status: formResponse.status,
        code: formResult?.error || formResult?.errors?.[0]?.code || formResult?.errors?.[0] || "unknown"
      });
      return res.status(502).json({ error: "Unable to complete signup right now" });
    }

    return res.status(200).json({ ok: true, confirmation_required: true });
  } catch (error) {
    console.error("Kit subscriber request failed", {
      name: error?.name || "Error"
    });
    return res.status(502).json({ error: "Unable to complete signup right now" });
  } finally {
    clearTimeout(timeout);
  }
};
