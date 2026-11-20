import { registerDecorator, ValidationOptions } from 'class-validator';

const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;

/** True for a real calendar date written as YYYY-MM-DD that is today or later. */
export function isFutureDate(value: unknown, today = new Date()): boolean {
  if (typeof value !== 'string' || !DATE_ONLY.test(value)) {
    return false;
  }
  // 2027-02-31 parses as 3 March, so a real date must survive the round trip
  const parsed = new Date(value);
  if (
    Number.isNaN(parsed.getTime()) ||
    parsed.toISOString().slice(0, 10) !== value
  ) {
    return false;
  }
  return value >= today.toISOString().slice(0, 10);
}

/** Use for expiry dates such as a licence or an insurance policy. */
export function IsFutureDate(options?: ValidationOptions): PropertyDecorator {
  return (target, propertyName) =>
    registerDecorator({
      name: 'isFutureDate',
      target: target.constructor,
      propertyName: String(propertyName),
      options: {
        message: `${String(propertyName)} must be a date that has not passed, written as YYYY-MM-DD`,
        ...options,
      },
      validator: { validate: (value: unknown) => isFutureDate(value) },
    });
}
