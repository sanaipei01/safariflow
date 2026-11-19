import { Transform } from 'class-transformer';

/** Removes leading and trailing spaces from a string property before validation. */
export const Trim = () =>
  Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  );
