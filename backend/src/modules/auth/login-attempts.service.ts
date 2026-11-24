import { Injectable } from '@nestjs/common';

export const MAX_FAILED_LOGINS = 5;
export const LOCKOUT_MINUTES = 15;

// Failed logins per email, kept in memory (a restart clears them).
@Injectable()
export class LoginAttemptsService {
  private readonly attempts = new Map<
    string,
    { failures: number; lockedUntil: number }
  >();

  /** Milliseconds until this email can try again, or 0 if it is not locked. */
  lockRemainingMs(email: string, now = Date.now()): number {
    const entry = this.attempts.get(email);
    if (entry && entry.lockedUntil > 0 && entry.lockedUntil <= now) {
      this.attempts.delete(email);
    }
    return Math.max((this.attempts.get(email)?.lockedUntil ?? 0) - now, 0);
  }

  /** Counts a failed login and returns how many tries are left. */
  recordFailure(email: string, now = Date.now()): number {
    const failures = (this.attempts.get(email)?.failures ?? 0) + 1;
    const locked = failures >= MAX_FAILED_LOGINS;
    this.attempts.set(email, {
      failures,
      lockedUntil: locked ? now + LOCKOUT_MINUTES * 60_000 : 0,
    });
    return Math.max(MAX_FAILED_LOGINS - failures, 0);
  }

  reset(email: string): void {
    this.attempts.delete(email);
  }
}
