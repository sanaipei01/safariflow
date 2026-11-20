import { isFutureDate } from './is-future-date.validator';

const today = new Date('2026-11-19T10:00:00Z');

describe('isFutureDate', () => {
  it.each(['2026-11-19', '2026-11-20', '2030-01-31'])('accepts %s', (value) => {
    expect(isFutureDate(value, today)).toBe(true);
  });

  it.each(['2026-11-18', '2020-01-01'])('rejects the past date %s', (value) => {
    expect(isFutureDate(value, today)).toBe(false);
  });

  it.each(['19/11/2027', '2027-02-31', 'soon', '', 20271119, null])(
    'rejects %p, which is not a real date',
    (value) => {
      expect(isFutureDate(value, today)).toBe(false);
    },
  );
});
