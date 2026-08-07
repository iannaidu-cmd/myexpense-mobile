// ─── Date input helpers ───────────────────────────────────────────────────────
// Every manual date field in the app displays and accepts "DD/MM/YYYY" — the
// SA-conventional day/month/year order. These helpers keep entry, display,
// and ISO conversion consistent across screens instead of each one
// re-implementing its own split("/") logic (and, previously, some fields not
// auto-inserting "/" at all — impossible to type on a numeric keypad, which
// has no "/" key).
// ─────────────────────────────────────────────────────────────────────────────

// Auto-inserts "/" after the day and after the month as the user types
// digits, so a numeric keypad still produces a valid DD/MM/YYYY string
// without the user having to type separators themselves.
export function formatDateInputDDMMYYYY(text: string): string {
  const digits = text.replace(/\D/g, "").slice(0, 8);
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
}

// ISO "YYYY-MM-DD" → "DD/MM/YYYY" for display. Returns the input unchanged
// if it isn't well-formed ISO (e.g. empty, or already DD/MM/YYYY).
export function isoToDisplayDate(iso: string): string {
  const parts = iso.split("-");
  if (parts.length !== 3) return iso;
  const [y, m, d] = parts;
  return `${d}/${m}/${y}`;
}

// "DD/MM/YYYY" → ISO "YYYY-MM-DD". Returns the input unchanged if it isn't
// well-formed DD/MM/YYYY (e.g. incomplete, or already ISO).
export function displayDateToISO(display: string): string {
  const parts = display.split("/");
  if (parts.length !== 3) return display;
  const [d, m, y] = parts;
  return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
}
