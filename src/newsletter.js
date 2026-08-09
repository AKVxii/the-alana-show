import { setupEditorialMotion } from "./lib/motion.js";

function newsletterMarkup() {
  return `
    <section class="newsletter-section" id="updates" aria-labelledby="newsletter-title">
      <div class="shell">
        <div class="newsletter-panel">
          <div class="newsletter-copy reveal">
            <p class="eyebrow"><span></span> Stay in the conversation</p>
            <h2 id="newsletter-title">New conversations, directly to your inbox.</h2>
            <p>Occasional updates from The Alana Show with new episodes, notable guests, specials, and South Florida broadcasts.</p>
          </div>

          <form class="newsletter-form reveal reveal-delay" data-newsletter-form novalidate>
            <div class="newsletter-fields">
              <label class="newsletter-field">
                <span>First name</span>
                <input name="first_name" autocomplete="given-name" maxlength="80" placeholder="First name">
              </label>
              <label class="newsletter-field">
                <span>Email *</span>
                <input name="email" type="email" autocomplete="email" inputmode="email" required placeholder="you@example.com">
              </label>
            </div>

            <label class="newsletter-honeypot" aria-hidden="true">Leave blank
              <input name="company_website" tabindex="-1" autocomplete="off">
            </label>

            <button class="button button-gold newsletter-submit" type="submit">Join the list →</button>
            <p class="newsletter-note">By subscribing, you agree to receive email updates from The Alana Show. Check your inbox to confirm your subscription. Unsubscribe anytime. Your information is never sold.</p>
            <div class="newsletter-status" data-newsletter-status role="status" aria-live="polite"></div>
          </form>
        </div>
      </div>
    </section>
  `;
}

function bindNewsletter(form) {
  const status = form.querySelector("[data-newsletter-status]");
  const button = form.querySelector('button[type="submit"]');

  form.addEventListener("submit", async event => {
    event.preventDefault();
    status.textContent = "";
    status.classList.remove("success");

    if (!form.checkValidity()) {
      form.reportValidity();
      status.textContent = "Please enter a valid email address.";
      return;
    }

    const data = Object.fromEntries(new FormData(form).entries());
    const original = button.textContent;
    form.setAttribute("aria-busy", "true");
    button.disabled = true;
    button.textContent = "Joining…";

    try {
      const response = await fetch("/api/subscribe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify(data)
      });

      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || "Unable to subscribe");

      form.reset();
      status.textContent = "Almost there — check your inbox to confirm your subscription.";
      status.classList.add("success");
    } catch {
      status.textContent = "We couldn't complete your signup just now. Please try again shortly.";
    } finally {
      form.setAttribute("aria-busy", "false");
      button.disabled = false;
      button.textContent = original;
    }
  });
}

function mountNewsletter(attempt = 0) {
  if (document.querySelector("#updates")) return;
  const contact = document.querySelector("#contact");
  if (!contact) {
    if (attempt < 30) requestAnimationFrame(() => mountNewsletter(attempt + 1));
    return;
  }

  contact.insertAdjacentHTML("beforebegin", newsletterMarkup());
  const section = document.querySelector("#updates");
  const form = section?.querySelector("[data-newsletter-form]");
  if (form) bindNewsletter(form);

  // This section is injected after the homepage's initial reveal observer is
  // created, so register its reveal nodes immediately instead of leaving them
  // permanently transparent in the pre-animation state.
  if (section) setupEditorialMotion(section);
}

mountNewsletter();
