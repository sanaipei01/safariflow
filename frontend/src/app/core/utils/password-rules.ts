import { AbstractControl, ValidationErrors } from '@angular/forms';

export interface PasswordRule {
  label: string;
  isMet: (password: string) => boolean;
}

// same rules as the server
export const PASSWORD_RULES: readonly PasswordRule[] = [
  { label: '8 to 72 characters', isMet: (value) => value.length >= 8 && value.length <= 72 },
  { label: 'An uppercase letter (A-Z)', isMet: (value) => /[A-Z]/.test(value) },
  { label: 'A lowercase letter (a-z)', isMet: (value) => /[a-z]/.test(value) },
  { label: 'A number (0-9)', isMet: (value) => /\d/.test(value) },
  { label: 'A special character, such as ! or @', isMet: (value) => /[^A-Za-z\d\s]/.test(value) },
];

export function passwordRulesValidator(control: AbstractControl<string>): ValidationErrors | null {
  const value = control.value ?? '';
  return value === '' || PASSWORD_RULES.every((rule) => rule.isMet(value))
    ? null
    : { passwordRules: true };
}

export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
