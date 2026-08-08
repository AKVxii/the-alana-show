import { icon } from "../lib/icons.js";
import { scheduleContactContext } from "../lib/contact-context.js";

export function Contact() {
  scheduleContactContext();
  return `
    <section class="section contact-section" id="contact">
      <div class="shell contact-grid">
        <div class="contact-copy reveal">
          <p class="eyebrow"><span></span> Connect with the show</p>
          <h2>Bring a meaningful conversation to the table.</h2>
          <p>Reach out about a guest, organization, sponsorship, media request, community story, or general question.</p>

          <div class="contact-direct">
            <a href="mailto:Alana@AlanaKVandeveer.com">${icon("mail")} Alana@AlanaKVandeveer.com</a>
            <span>${icon("shield")} Your information is never sold.</span>
          </div>
        </div>

        <form class="contact-form reveal reveal-delay" data-contact-form novalidate>
          <input type="hidden" name="source" value="" data-inquiry-source>
          <div class="form-heading">
            <span>Direct inquiry</span>
            <h3>How can we connect?</h3>
          </div>

          <div class="form-grid">
            <label>
              <span>Name *</span>
              <input name="name" autocomplete="name" required>
            </label>
            <label>
              <span>Email *</span>
              <input name="email" type="email" autocomplete="email" required>
            </label>
            <label>
              <span>Organization</span>
              <input name="organization" autocomplete="organization">
            </label>
            <label>
              <span>Phone</span>
              <input name="phone" type="tel" autocomplete="tel">
            </label>
            <label class="full">
              <span>Inquiry *</span>
              <select name="inquiry" required data-inquiry-select>
                <option value="">Choose an option</option>
                <option>Candidate Interview Series</option>
                <option>Advertising or partnership</option>
                <option>Recommend a guest</option>
                <option>Recommend an organization</option>
                <option>Media inquiry</option>
                <option>Support the show</option>
                <option>General contact</option>
              </select>
            </label>
            <label class="full">
              <span>Website or social link</span>
              <input name="website" type="text" inputmode="url" autocomplete="url" placeholder="example.com or @username" aria-describedby="website-help">
              <small class="field-help" id="website-help">Enter a website address, full link, or social username.</small>
            </label>
            <label class="full">
              <span>Message *</span>
              <textarea name="message" required placeholder="Tell us about the opportunity, guest, organization, or story."></textarea>
            </label>
          </div>

          <label class="honeypot" aria-hidden="true">Leave blank<input name="company_website" tabindex="-1" autocomplete="off"></label>

          <div class="form-footer">
            <p>Submission does not guarantee an appearance. Selected community-service guests are not charged an appearance fee.</p>
            <button class="button button-gold" type="submit">Send inquiry ${icon("arrow")}</button>
          </div>
          <div class="form-status" data-form-status role="status" aria-live="polite"></div>
        </form>
      </div>
    </section>
  `;
}
