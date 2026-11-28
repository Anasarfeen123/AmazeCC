/**
 * Display helpers for names coming from VTOP.
 *
 * VTOP sends faculty as "54828 RANJITH R SCOPE" (employee id + name + school)
 * and student names in full caps. The id is noise on cards (user feedback,
 * 2026-11-19) and a full caps legal name truncates on phones.
 */

/** "54828 RANJITH R SCOPE" -> "RANJITH R SCOPE". Keeps the input if nothing is left. */
export function facultyDisplayName(raw: string | null | undefined): string {
  const s = String(raw ?? "").trim();
  const stripped = s.replace(/^\d{3,}\s*[-–:]?\s*/, "").trim();
  return stripped || s;
}

/** "ANAS SHAMSIL ARFEEN" -> "Anas". A reg number or empty input is returned unchanged. */
export function greetingName(raw: string | null | undefined): string {
  const s = String(raw ?? "").trim();
  if (!s || /\d/.test(s)) return s;
  const first = s.split(/\s+/)[0];
  return first.charAt(0).toUpperCase() + first.slice(1).toLowerCase();
}

/**
 * A course name short enough for a stat card: whole words up to `max`
 * characters, then "…" ("Complex Variables and Linear Algebra" ->
 * "Complex Variables…"). Trailing joiners ("and", "of", "&") are dropped so
 * it never ends on one. The full code is shown elsewhere on the card.
 */
export function shortCourseName(title?: string | null, max = 18): string {
  const t = (title || "").trim().replace(/\s+/g, " ");
  if (t.length <= max) return t;
  const words = t.split(" ");
  let out = "";
  for (const w of words) {
    const next = out ? `${out} ${w}` : w;
    if (next.length > max) break;
    out = next;
  }
  out = out.replace(/\s+(and|of|&|for|to|in|the|with)$/i, "");
  return `${out || t.slice(0, max)}…`;
}
