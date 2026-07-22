/**
 * Shared formatting helpers for the Utzshop Stock Management System.
 * Centralising this here means the currency format (or locale) only
 * ever needs to change in one place.
 */

/**
 * Format a numeric value as Malaysian Ringgit, e.g. formatCurrency(19.5) -> "RM 19.50".
 * Accepts numbers, numeric strings, null, or undefined (treated as 0) so it can be used
 * directly on values coming straight from the API without extra guards at each call site.
 */
export function formatCurrency(value: number | string | null | undefined): string {
  const amount = typeof value === "number" ? value : Number(value ?? 0);
  const safeAmount = Number.isFinite(amount) ? amount : 0;

  return `RM ${safeAmount.toFixed(2)}`;
}

const MONTH_ABBR = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

/**
 * Extracts the plain "YYYY-MM-DD" calendar date from any date/timestamp
 * string the API returns (e.g. "2026-07-22" or "2026-07-22T00:00:00.000Z").
 *
 * Deliberately does NOT go through `new Date(...)`. Parsing a string into a
 * Date object and then reading it back out (via toLocaleDateString,
 * toISOString, etc.) re-interprets the value against a timezone, and if the
 * server's timezone offset isn't 0 that round trip can silently shift the
 * calendar date by a day. Reading the digits straight out of the string
 * side-steps timezones entirely, so the date shown always matches the date
 * actually stored.
 */
export function toDateOnly(value: string | null | undefined): string {
  if (!value) return "";
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
  return match ? match[0] : "";
}

/**
 * Formats a date/timestamp string as e.g. "Jul 22, 2026" using only its
 * calendar-date digits — see toDateOnly for why this avoids `new Date(...)`.
 */
export function formatDate(value: string | null | undefined): string {
  const iso = toDateOnly(value);
  if (!iso) return value ? value : "—";
  const [y, m, d] = iso.split("-").map(Number);
  if (!y || !m || !d || m < 1 || m > 12) return value ?? "—";
  return `${MONTH_ABBR[m - 1]} ${d}, ${y}`;
}
