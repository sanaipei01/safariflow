import { FormControl } from '@angular/forms';
import { EMAIL_PATTERN, passwordRulesValidator } from './password-rules';

const check = (value: string) =>
  passwordRulesValidator(new FormControl(value, { nonNullable: true }));

describe('passwordRulesValidator', () => {
  it('accepts a password that meets every rule', () => {
    expect(check('Password123!')).toBeNull();
  });

  it.each(['Ab1!', 'password123!', 'PASSWORD123!', 'Password!!!!', 'Password1234'])(
    'rejects %s',
    (value) => {
      expect(check(value)).toEqual({ passwordRules: true });
    },
  );
});

describe('EMAIL_PATTERN', () => {
  it.each(['name@example.com', 'a.b+c@mail.co.ke'])('accepts %s', (value) => {
    expect(EMAIL_PATTERN.test(value)).toBe(true);
  });

  it.each(['plain', 'a@b', 'a b@example.com', '@example.com'])('rejects %s', (value) => {
    expect(EMAIL_PATTERN.test(value)).toBe(false);
  });
});
