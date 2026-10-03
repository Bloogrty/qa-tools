// Loose match: lowercase, drop -, _ and spaces.
export function normalize(str) {
  return str.toLowerCase().replace(/[-_\s]/g, "");
}
