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
