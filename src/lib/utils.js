import { broadcastSchedule } from "../data/site.js";

export function escapeHtml(value = "") {
  return String(value).replace(/[&<>"']/g, character => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  })[character]);
}

export function formatDate(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.valueOf())) return "";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC"
  }).format(date);
}

export function formatDuration(totalSeconds = 0) {
  const seconds = Number(totalSeconds);
  if (!Number.isFinite(seconds) || seconds <= 0) return "";
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  return hours ? `${hours}h ${minutes}m` : `${minutes} min`;
}

export function compactNumber(value = 0) {
  const number = Number(value);
  if (!Number.isFinite(number)) return "";
  return new Intl.NumberFormat("en-US", {
    notation: "compact",
    maximumFractionDigits: 1
  }).format(number);
}

export function excerpt(value = "", length = 150) {
  const clean = String(value).replace(/\s+/g, " ").trim();
  return clean.length > length ? `${clean.slice(0, length).trim()}…` : clean;
}

const DOMAIN_WITH_OPTIONAL_PATH = /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}(?::\d{1,5})?(?:[/?#][^\s]*)?$/i;
const SOCIAL_USERNAME = /^@[a-z0-9._-]+$/i;

export function normalizeWebsiteOrSocial(value = "") {
  const trimmed = String(value).trim();
  if (!trimmed || trimmed.startsWith("@") || /^https?:\/\//i.test(trimmed)) return trimmed;
  return DOMAIN_WITH_OPTIONAL_PATH.test(trimmed) ? `https://${trimmed}` : trimmed;
}

export function isValidWebsiteOrSocial(value = "") {
  const raw = String(value);
  if (!raw) return true;
  if (!raw.trim()) return false;
  const normalized = normalizeWebsiteOrSocial(value);
  if (normalized.startsWith("@")) return SOCIAL_USERNAME.test(normalized);
  if (!/^https?:\/\//i.test(normalized)) return false;

  try {
    const url = new URL(normalized);
    return (url.protocol === "http:" || url.protocol === "https:")
      && DOMAIN_WITH_OPTIONAL_PATH.test(`${url.hostname}${url.port ? `:${url.port}` : ""}`);
  } catch {
    return false;
  }
}

export function nextBroadcastLabel() {
  const now = new Date();
  const easternParts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    weekday: "short",
    hour: "numeric",
    minute: "numeric",
    hour12: false
  }).formatToParts(now);

  const value = type => easternParts.find(part => part.type === type)?.value;
  const weekday = value("weekday");
  const hour = Number(value("hour"));
  const minute = Number(value("minute"));

  if (weekday === "Tue" && hour === 20 && minute < 30) {
    return { label: "On Air Now", live: true };
  }

  return { label: broadcastSchedule, live: false };
}
