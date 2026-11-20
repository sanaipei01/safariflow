import { fromIsoDate, toIsoDate } from './date';

describe('date helpers', () => {
  it('writes a date as YYYY-MM-DD with leading zeros', () => {
    expect(toIsoDate(new Date(2027, 0, 5))).toBe('2027-01-05');
  });

  it('reads a date back without shifting the day', () => {
    expect(toIsoDate(fromIsoDate('2027-12-31'))).toBe('2027-12-31');
  });
});
