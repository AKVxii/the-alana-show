function escapeHtml(value = "") {
  return String(value).replace(/[&<>"']/g, char => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;"
  })[char]);
}

function validEmail(value = "") {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const {
    name = "",
    email = "",
    organization = "",
    phone = "",
    inquiry = "",
    website = "",
    message = "",
    company_website = ""
  } = req.body || {};

  // Honeypot: silently accept bot submissions without sending.
  if (company_website) return res.status(200).json({ ok: true });

  if (!name.trim() || !validEmail(email) || !inquiry.trim() || !message.trim()) {
    return res.status(400).json({ error: "Please complete the required fields" });
  }

  if (message.length > 8000) {
    return res.status(400).json({ error: "Message is too long" });
  }

  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.CONTACT_TO_EMAIL;
  const from = process.env.CONTACT_FROM_EMAIL;

  if (!apiKey || !to || !from) {
    return res.status(503).json({ error: "Contact email is not configured" });
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
    <hr>
    <p>${escapeHtml(message).replace(/\n/g, "<br>")}</p>
  `;

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        from,
        to: [to],
        reply_to: email,
        subject,
        html
      })
    });

    const result = await response.json();
    if (!response.ok) {
      console.error(result);
      return res.status(502).json({ error: "Unable to send inquiry" });
    }

    return res.status(200).json({ ok: true });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Unable to send inquiry" });
  }
};
