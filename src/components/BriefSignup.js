export function BriefSignup({ source = "site", compact = false } = {}) {
  return `
    <section class="brief-signup${compact ? " brief-signup-compact" : ""}" aria-labelledby="alana-brief-heading">
      <div class="shell brief-signup-shell">
        <div class="brief-signup-copy">
          <p class="brief-kicker"><span></span> The Alana Brief</p>
          <h2 id="alana-brief-heading">The conversations worth carrying forward.</h2>
          <p class="brief-deck">A concise note with new conversations, standout ideas, South Florida voices, and what is coming next from The Alana Show.</p>
          <div class="brief-promises" aria-label="Newsletter promises">
            <span>Thoughtful, not constant</span>
            <span>Direct from the show</span>
            <span>Unsubscribe anytime</span>
          </div>
        </div>

        <div class="brief-signup-card">
          <span class="brief-card-label">Join the list</span>
          <h3>Receive The Alana Brief.</h3>
          <form class="brief-form" data-brief-form novalidate>
            <input type="hidden" name="source" value="${source}">
            <label>
              <span>First name <small>optional</small></span>
              <input name="first_name" autocomplete="given-name" maxlength="80" placeholder="First name">
            </label>
            <label>
              <span>Email address</span>
              <input name="email" type="email" autocomplete="email" inputmode="email" required maxlength="254" placeholder="you@example.com">
            </label>
            <label class="brief-honeypot" aria-hidden="true">Leave blank<input name="website" tabindex="-1" autocomplete="off"></label>
            <button class="button button-gold brief-submit" type="submit">Join The Alana Brief <span aria-hidden="true">→</span></button>
            <p class="brief-consent">By subscribing, you agree to receive The Alana Brief by email. No sold lists. Unsubscribe anytime.</p>
            <p class="brief-form-status" data-brief-status role="status" aria-live="polite"></p>
          </form>
        </div>
      </div>
    </section>
  `;
}
