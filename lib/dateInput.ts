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

// True for a real calendar date in ISO "YYYY-MM-DD" form (rejects 31/02,
// month 13, partial input, etc.), so it's safe to send to a Postgres date.
export function isValidISODate(iso: string): boolean {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!m) return false;
  const [y, mo, d] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const dt = new Date(y, mo - 1, d);
  return dt.getFullYear() === y && dt.getMonth() === mo - 1 && dt.getDate() === d;
}

// Date → ISO "YYYY-MM-DD" in the device's local time zone. Use this instead
// of toISOString().split("T")[0], which gives the UTC date — in SAST (UTC+2)
// anything between midnight and 02:00 lands on the previous day.
export function localISODate(d: Date): string {
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}
