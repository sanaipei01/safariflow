export const PASSWORD_MIN_LENGTH = 8;
// bcrypt only uses the first 72 bytes
export const PASSWORD_MAX_LENGTH = 72;

export const PASSWORD_PATTERN = new RegExp(
  '^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[^A-Za-z\\d\\s])' +
    `.{${PASSWORD_MIN_LENGTH},${PASSWORD_MAX_LENGTH}}$`,
);

export const PASSWORD_RULES_MESSAGE =
  `Password must be ${PASSWORD_MIN_LENGTH} to ${PASSWORD_MAX_LENGTH} characters long ` +
  'and include an uppercase letter, a lowercase letter, a number and a special character';

export const EMAIL_MAX_LENGTH = 254;
export const EMAIL_MESSAGE =
  'Enter a valid email address, for example name@example.com';
