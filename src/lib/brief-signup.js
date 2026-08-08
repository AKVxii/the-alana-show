const validEmail = value => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || "").trim());

export function setupBriefSignupForms(root = document) {
  root.querySelectorAll("[data-brief-form]").forEach(form => {
    if (form.dataset.bound === "true") return;
    form.dataset.bound = "true";

    const status = form.querySelector("[data-brief-status]");
    const email = form.elements.namedItem("email");
    const button = form.querySelector('button[type="submit"]');

    form.addEventListener("submit", async event => {
      event.preventDefault();
      status.textContent = "";
      status.classList.remove("success", "error");
      email?.setCustomValidity("");

      if (!validEmail(email?.value)) {
        email?.setCustomValidity("Enter a valid email address.");
      }

      if (!form.checkValidity()) {
        form.reportValidity();
        status.textContent = "Please enter a valid email address.";
        status.classList.add("error");
        return;
      }

      const payload = Object.fromEntries(new FormData(form).entries());
      const original = button.innerHTML;
      button.disabled = true;
      button.textContent = "Joining…";
      form.setAttribute("aria-busy", "true");

      try {
        const response = await fetch("/api/brief", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
        const result = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(result.error || "Unable to subscribe");

        form.reset();
        status.textContent = "You're on the list. Please check your inbox for any confirmation required by The Alana Brief.";
        status.classList.add("success");
      } catch (error) {
        status.textContent = error.message === "Newsletter signup is not configured"
          ? "The Alana Brief signup connection is being prepared. Please check back shortly."
          : "We couldn't complete the signup. Please try again in a moment.";
        status.classList.add("error");
      } finally {
        form.setAttribute("aria-busy", "false");
        button.disabled = false;
        button.innerHTML = original;
      }
    });
  });
}
