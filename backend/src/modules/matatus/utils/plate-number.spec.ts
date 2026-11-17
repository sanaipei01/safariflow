import { PLATE_NUMBER_PATTERN, normalizePlateNumber } from './plate-number';

describe('normalizePlateNumber', () => {
  it.each([
    ['kda123a', 'KDA 123A'],
    ['  KDA   123A ', 'KDA 123A'],
    ['KBZ 456', 'KBZ 456'],
  ])('turns "%s" into "%s"', (input, expected) => {
    expect(normalizePlateNumber(input)).toBe(expected);
  });

  it('leaves something that is not a plate for validation to reject', () => {
    expect(normalizePlateNumber(' abc ')).toBe('ABC');
    expect(PLATE_NUMBER_PATTERN.test('ABC')).toBe(false);
  });
});
