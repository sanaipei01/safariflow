/** Kenyan plates look like "KDA 123A" (new style) or "KDA 123" (older style). */
export const PLATE_NUMBER_PATTERN = /^K[A-Z]{2} \d{3}[A-Z]?$/;

/**
 * Stores every plate the same way, so "kda123a" and "KDA  123A" are the same
 * vehicle. Anything that is not a plate is returned in upper case and left
 * for validation to reject.
 */
export function normalizePlateNumber(value: string): string {
  const compact = value.toUpperCase().replace(/\s+/g, '');
  const match = /^(K[A-Z]{2})(\d{3}[A-Z]?)$/.exec(compact);
  return match ? `${match[1]} ${match[2]}` : value.trim().toUpperCase();
}
