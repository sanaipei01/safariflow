const pad = (value: number): string => String(value).padStart(2, '0');

/** A date as YYYY-MM-DD in the user's own time zone, which is the format the API expects. */
export function toIsoDate(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/** Turns YYYY-MM-DD from the API back into a date for the date picker. */
export function fromIsoDate(value: string): Date {
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, month - 1, day);
}
