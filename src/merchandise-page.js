import { MediaHeader, setupMediaNavigation } from "./components/MediaHeader.js";
import { Footer } from "./components/Footer.js";
import { trackEvent } from "./lib/measurement.js";

const header = document.querySelector("[data-merchandise-header]");
const footer = document.querySelector("[data-merchandise-footer]");
const form = document.querySelector("[data-merchandise-form]");
const status = document.querySelector("[data-merchandise-status]");

if (header) header.innerHTML = MediaHeader();
if (footer) footer.innerHTML = Footer({ fromSubpage: true });
setupMediaNavigation();

function clean(value = "") {
  return String(value).trim();
}

form?.addEventListener("submit", async event => {
  event.preventDefault();
  status.textContent = "";
  status.classList.remove("success");

  if (!form.checkValidity()) {
    form.reportValidity();
    status.textContent = "Please complete the required order details.";
    trackEvent("Merchandise Form Invalid", { page: location.pathname });
    return;
  }

  const values = Object.fromEntries(new FormData(form).entries());
  const button = form.querySelector('button[type="submit"]');
  const original = button.innerHTML;
  const message = [
    "MERCHANDISE ORDER INQUIRY",
    "",
    `Item: ${clean(values.item)}`,
    `Requested size: ${clean(values.size)}`,
    `Quantity: ${clean(values.quantity)}`,
    `Shipping ZIP / postal code: ${clean(values.postal)}`,
    `Payment preference: ${clean(values.payment) || "Confirm by email"}`,
    "",
    `Notes: ${clean(values.notes) || "None"}`,
    "",
    "Customer understands this is an inquiry only and that availability, final price, shipping, timing, and payment are confirmed before purchase."
  ].join("\n");

  form.setAttribute("aria-busy", "true");
  button.disabled = true;
  button.textContent = "Sending…";

  try {
    const response = await fetch("/api/contact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: clean(values.name),
        email: clean(values.email),
        organization: "",
        phone: "",
        website: "",
        inquiry: "Merchandise order",
        source: "merchandise",
        company_website: clean(values.company_website),
        message
      })
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(result.error || "Unable to send inquiry");

    form.reset();
    status.textContent = "Thank you. Your merchandise inquiry has been sent. Alana will confirm the details by email.";
    status.classList.add("success");
    trackEvent("Merchandise Inquiry Success", { item: clean(values.item) });
  } catch {
    status.textContent = "Your inquiry could not be sent. Please email Alana@AlanaKVandeveer.com.";
    trackEvent("Merchandise Inquiry Failure", { page: location.pathname });
  } finally {
    form.setAttribute("aria-busy", "false");
    button.disabled = false;
    button.innerHTML = original;
  }
});
