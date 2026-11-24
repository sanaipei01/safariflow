import { HttpErrorResponse } from '@angular/common/http';
import { getErrorMessage } from './http-error';

const failure = (status: number, message?: string | string[]) =>
  new HttpErrorResponse({ status, error: message ? { message } : null });

describe('getErrorMessage', () => {
  it('shows the message the server sent, or the first of a list', () => {
    expect(getErrorMessage(failure(401, 'Incorrect password.'))).toBe('Incorrect password.');
    expect(getErrorMessage(failure(400, ['First', 'Second']))).toBe('First');
  });

  it('replaces the technical message of the general rate limit', () => {
    expect(getErrorMessage(failure(429, 'ThrottlerException: Too Many Requests'))).toBe(
      'Too many requests. Please wait a moment and try again.',
    );
  });

  it('tells the user when the server cannot be reached', () => {
    expect(getErrorMessage(failure(0))).toContain('Cannot reach the server');
  });
});
