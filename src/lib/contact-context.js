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
    const currentScroll = window.scrollY;
    let top = Math.max(0, currentScroll + contact.getBoundingClientRect().top - headerHeight - 18);

    // Contextual partnership/guest links should present the inquiry as a complete,
    // composed moment on desktop. If the form footer would sit just below the
    // viewport after the normal anchor alignment, move only the amount needed to
    // reveal it, while preserving generous space around the editorial heading.
    const params = new URLSearchParams(window.location.search);
    const isContextualInquiry = Boolean(params.get("inquiry"));
    const form = document.querySelector("[data-contact-form]");
    if (isContextualInquiry && form && window.innerWidth >= 1024) {
      const scrollDelta = top - currentScroll;
      const projectedFormBottom = form.getBoundingClientRect().bottom - scrollDelta;
      const viewportFloor = window.innerHeight - 18;
      const overflow = projectedFormBottom - viewportFloor;
      if (overflow > 0) top += Math.min(overflow + 12, 56);
    }

    // The site intentionally uses smooth scrolling for user navigation. Deep-link
    // correction is different: it should arrive at the final position without a
    // visible animated "self-scroll" while late layout settles.
    const root = document.documentElement;
    const previousScrollBehavior = root.style.scrollBehavior;
    root.style.scrollBehavior = "auto";
    window.scrollTo(0, top);
    root.style.scrollBehavior = previousScrollBehavior;
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
