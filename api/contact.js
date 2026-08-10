const ALLOWED_INQUIRIES = new Set([
  "Candidate Interview Series",
  "Advertising or partnership",
  "Recommend a guest",
  "Recommend an organization",
  "Media inquiry",
  "Support the show",
  "General contact"
]);

function escapeHtml(value = "") {
  return String(value).replace(/[&<>"']/g, char => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;"
  })[char]);
}

function validEmail(value = "") {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function cleanSingleLine(value = "", maxLength = 200) {
  return String(value)
    .replace(/[\u0000-\u001f\u007f<>]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLength);
}

function cleanMessage(value = "") {
  return String(value)
    .replace(/\u0000/g, "")
    .replace(/\r\n?/g, "\n")
    .trim()
    .slice(0, 8000);
}

function safeSource(value = "") {
  return String(value).replace(/[^a-z0-9._/-]/gi, "").slice(0, 80);
}

function sameOriginRequest(req) {
  const origin = req.headers.origin;
  const forwardedHost = req.headers["x-forwarded-host"];
  const host = String(forwardedHost || req.headers.host || "").split(",")[0].trim();
  const forwardedProto = String(req.headers["x-forwarded-proto"] || "https").split(",")[0].trim().toLowerCase();

  if (!origin || !host || !["https", "http"].includes(forwardedProto)) return false;

  try {
    return new URL(origin).origin === `${forwardedProto}://${host}`;
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

  const contentType = String(req.headers["content-type"] || "").toLowerCase();
  if (!contentType.startsWith("application/json")) {
    return res.status(415).json({ error: "Unsupported content type" });
  }

  const contentLength = Number(req.headers["content-length"] || 0);
  if (Number.isFinite(contentLength) && contentLength > 20000) {
    return res.status(413).json({ error: "Request is too large" });
  }

  const body = req.body && typeof req.body === "object" && !Array.isArray(req.body) ? req.body : {};
  const honeypot = cleanSingleLine(body.company_website, 200);
  if (honeypot) return res.status(200).json({ ok: true });

  const name = cleanSingleLine(body.name, 120);
  const email = cleanSingleLine(body.email, 320).toLowerCase();
  const organization = cleanSingleLine(body.organization, 160);
  const phone = cleanSingleLine(body.phone, 80);
  const inquiry = cleanSingleLine(body.inquiry, 120);
  const website = cleanSingleLine(body.website, 500);
  const message = cleanMessage(body.message);
  const inquirySource = safeSource(body.source);

  if (!name || !validEmail(email) || !ALLOWED_INQUIRIES.has(inquiry) || !message) {
    return res.status(400).json({ error: "Please complete the required fields" });
  }

  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.CONTACT_TO_EMAIL;
  const from = process.env.CONTACT_FROM_EMAIL;

  if (!apiKey || !to || !from) {
    return res.status(503).json({ error: "Contact email is temporarily unavailable" });
  }

  const subject = `The Alana Show inquiry: ${inquiry}`;
  const html = `
    <h2>${escapeHtml(subject)}</h2>
    <p><strong>Name:</strong> ${escapeHtml(name)}</p>
    <p><strong>Email:</strong> ${escapeHtml(email)}</p>
    <p><strong>Organization:</strong> ${escapeHtml(organization)}</p>
    <p><strong>Phone:</strong> ${escapeHtml(phone)}</p>
    <p><strong>Website:</strong> ${escapeHtml(website)}</p>
    <p><strong>Inquiry type:</strong> ${escapeHtml(inquiry)}</p>
    ${inquirySource ? `<p><strong>Inquiry source:</strong> ${escapeHtml(inquirySource)}</p>` : ""}
    <hr>
    <p>${escapeHtml(message).replace(/\n/g, "<br>")}</p>
  `;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ from, to: [to], reply_to: email, subject, html }),
      signal: controller.signal
    });

    const result = await jsonOrEmpty(response);
    if (!response.ok) {
      console.error("Resend contact request failed", {
        status: response.status,
        code: result?.name || result?.statusCode || "unknown"
      });
      return res.status(502).json({ error: "Unable to send inquiry" });
    }

    return res.status(200).json({ ok: true });
  } catch (error) {
    console.error("Resend contact request failed", { name: error?.name || "Error" });
    return res.status(502).json({ error: "Unable to send inquiry" });
  } finally {
    clearTimeout(timeout);
  }
};
