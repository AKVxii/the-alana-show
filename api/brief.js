function validEmail(value = "") {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value).trim());
}

function safeText(value = "", max = 120) {
  return String(value).replace(/[<>]/g, "").trim().slice(0, max);
}

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { first_name = "", email = "", source = "site", website = "" } = req.body || {};
  if (website) return res.status(200).json({ ok: true });

  const cleanEmail = String(email).trim().toLowerCase();
  if (!validEmail(cleanEmail)) {
    return res.status(400).json({ error: "Enter a valid email address" });
  }

  const apiKey = process.env.KIT_API_KEY;
  const formId = process.env.KIT_BRIEF_FORM_ID;
  if (!apiKey || !formId) {
    return res.status(503).json({ error: "Newsletter signup is not configured" });
  }

  const referrer = `https://thealanashow.com/?brief_source=${encodeURIComponent(safeText(source, 60) || "site")}`;

  try {
    const subscriberResponse = await fetch("https://api.kit.com/v4/subscribers", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Kit-Api-Key": apiKey
      },
      body: JSON.stringify({
        email_address: cleanEmail,
        first_name: safeText(first_name, 80) || undefined
      })
    });

    const subscriberResult = await subscriberResponse.json().catch(() => ({}));
    if (!subscriberResponse.ok || !subscriberResult.subscriber?.id) {
      console.error("Kit subscriber error", subscriberResult);
      return res.status(502).json({ error: "Unable to subscribe" });
    }

    const formResponse = await fetch(`https://api.kit.com/v4/forms/${encodeURIComponent(formId)}/subscribers/${encodeURIComponent(subscriberResult.subscriber.id)}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Kit-Api-Key": apiKey
      },
      body: JSON.stringify({ referrer })
    });

    const formResult = await formResponse.json().catch(() => ({}));
    if (!formResponse.ok) {
      console.error("Kit form error", formResult);
      return res.status(502).json({ error: "Unable to subscribe" });
    }

    return res.status(200).json({ ok: true });
  } catch (error) {
    console.error("Kit signup error", error);
    return res.status(500).json({ error: "Unable to subscribe" });
  }
};
