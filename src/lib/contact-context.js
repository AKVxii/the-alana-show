let scheduled = false;

function cleanSource(value = "") {
  return String(value).replace(/[^a-z0-9._/-]/gi, "").slice(0, 80);
}

function alignContactSection() {
  if (window.location.hash !== "#contact") return;

  const contact = document.querySelector("#contact");
  if (!contact) return;

  let cancelled = false;
  const cancelEvents = ["wheel", "touchstart", "pointerdown", "keydown"];
  const cancelAlignment = () => { cancelled = true; };
  cancelEvents.forEach(type => window.addEventListener(type, cancelAlignment, { once: true }));

  const align = () => {
    if (cancelled) return;
    const header = document.querySelector("[data-header]");
    const headerHeight = header?.getBoundingClientRect().height || 66;
    const top = Math.max(0, window.scrollY + contact.getBoundingClientRect().top - headerHeight - 18);
    window.scrollTo({ top, behavior: "auto" });
  };

  requestAnimationFrame(() => requestAnimationFrame(align));
  setTimeout(align, 250);
  setTimeout(align, 900);
  setTimeout(() => cancelEvents.forEach(type => window.removeEventListener(type, cancelAlignment)), 1200);
}

export function scheduleContactContext() {
  if (scheduled) return;
  scheduled = true;

  queueMicrotask(() => {
    const form = document.querySelector("[data-contact-form]");
    if (!form) return;

    const params = new URLSearchParams(window.location.search);
    const requestedInquiry = params.get("inquiry") || "";
    const select = form.elements.namedItem("inquiry");
    const source = form.elements.namedItem("source");

    if (select && requestedInquiry) {
      const matchingOption = [...select.options].find(option => option.value === requestedInquiry);
      if (matchingOption) select.value = requestedInquiry;
    }

    if (source) source.value = cleanSource(params.get("source") || "");
    alignContactSection();
  });
}
