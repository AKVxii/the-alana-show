const GENERIC_EDITORIAL_COPY = [
  /^watch\b.*\b(?:conversation|episode)\b/i,
  /^(?:a|an|the)\s+(?:featured\s+)?conversation\b/i,
  /^explore\s+(?:this|the)\s+conversation\b/i
];

function normalize(value = "") {
  return String(value).replace(/\s+/g, " ").trim();
}

function meaningfulCopyIssue(value, label, minimumLength) {
  const copy = normalize(value);
  if (!copy) return `${label} is required`;
  if (copy.length < minimumLength) return `${label} must be specific and at least ${minimumLength} characters`;
  if (GENERIC_EDITORIAL_COPY.some(pattern => pattern.test(copy))) return `${label} must describe the verified people and substance of this conversation`;
  return "";
}

export function unverifiedEditorialCopyIssue({ description, deck } = {}) {
  const descriptionIssue = meaningfulCopyIssue(description, "description", 80);
  if (descriptionIssue) return descriptionIssue;
  return meaningfulCopyIssue(deck, "deck", 60);
}
