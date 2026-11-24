import {
  LOCKOUT_MINUTES,
  LoginAttemptsService,
  MAX_FAILED_LOGINS,
} from './login-attempts.service';

const email = 'driver@safariflow.test';
const now = 1_000_000;
const lockMs = LOCKOUT_MINUTES * 60_000;

function failTimes(service: LoginAttemptsService, times: number): void {
  for (let i = 0; i < times; i++) {
    service.recordFailure(email, now);
  }
}

describe('LoginAttemptsService', () => {
  let service: LoginAttemptsService;

  beforeEach(() => {
    service = new LoginAttemptsService();
  });

  it('counts the tries left after each failure', () => {
    expect(service.recordFailure(email, now)).toBe(MAX_FAILED_LOGINS - 1);
    expect(service.recordFailure(email, now)).toBe(MAX_FAILED_LOGINS - 2);
  });

  it('locks the email after the last allowed failure until the lock time passes', () => {
    failTimes(service, MAX_FAILED_LOGINS);

    expect(service.lockRemainingMs(email, now)).toBe(lockMs);
    expect(service.lockRemainingMs(email, now + lockMs)).toBe(0);
    expect(service.recordFailure(email, now + lockMs)).toBe(
      MAX_FAILED_LOGINS - 1,
    );
  });

  it('starts counting again after a successful login', () => {
    failTimes(service, 2);
    service.reset(email);

    expect(service.recordFailure(email, now)).toBe(MAX_FAILED_LOGINS - 1);
  });
});
