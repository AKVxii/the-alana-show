let scheduled = false;

function cleanSource(value = "") {
  return String(value).replace(/[^a-z0-9._/-]/gi, "").slice(0, 80);
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
  });
}
