/**
 * Drops alpha channel from #RRGGBBAA so backend (which only accepts #RRGGBB) is happy.
 * Returns null for empty input. Returns the value unchanged if it doesn't match
 * either canonical form — server-side validation will surface the error.
 *
 * @param hex - Raw color string from the picker (may be 6- or 8-digit hex, or null).
 * @returns Canonical #RRGGBB hex, or null when input is empty.
 */
export function stripHexAlpha(hex: string | null | undefined): string | null {
  if (!hex) { return null; }
  return /^#[0-9A-Fa-f]{8}$/.test(hex) ? hex.slice(0, 7) : hex;
}
