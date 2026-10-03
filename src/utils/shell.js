export function shq(s) {
  return `'${String(s).replace(/'/g, `'\\''`)}'`;
}

export function shellQuote(s) {
  return /^[\w.@%+=:,/-]+$/.test(s) ? s : shq(s);
}
