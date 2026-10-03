const ENABLED =
  (import.meta.env.VITE_APP_PASSWORD_ENABLED || "").trim().toLowerCase() === "true";
const PASSWORD = import.meta.env.VITE_APP_PASSWORD || "";

const AUTH_KEY = "qatools_auth_until";
const AUTH_TTL = 30 * 24 * 60 * 60 * 1000;

export const passwordRequired = ENABLED && PASSWORD !== "";

export function checkPassword(input) {
  return input === PASSWORD;
}

export function isAppAuthed() {
  return Number(localStorage.getItem(AUTH_KEY)) > Date.now();
}

export function markAppAuthed() {
  localStorage.setItem(AUTH_KEY, String(Date.now() + AUTH_TTL));
}
