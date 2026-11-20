import { Transform } from 'class-transformer';

const trim = (value: unknown): unknown => {
  if (typeof value === 'string') {
    return value.trim();
  }
  return Array.isArray(value) ? value.map(trim) : value;
};

/** Removes leading and trailing spaces from a string, or from every string in a list. */
export const Trim = () =>
  Transform(({ value }: { value: unknown }) => trim(value));
