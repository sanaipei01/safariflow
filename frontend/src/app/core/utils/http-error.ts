import { HttpErrorResponse } from '@angular/common/http';

/** Turns a failed API call into one message that is safe to show to the user. */
export function getErrorMessage(error: unknown): string {
  if (!(error instanceof HttpErrorResponse)) {
    return 'Something went wrong. Please try again.';
  }
  if (error.status === 0) {
    return 'Cannot reach the server. Check that the backend is running.';
  }
  const message = (error.error as { message?: string | string[] } | null)?.message;
  if (Array.isArray(message)) {
    return message[0];
  }
  return message ?? 'Something went wrong. Please try again.';
}
