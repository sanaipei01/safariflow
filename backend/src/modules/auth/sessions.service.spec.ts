import { ConfigService } from '@nestjs/config';
import { SessionsService } from './sessions.service';

const now = 1_000_000;
const later = now + 86_400_000;

function buildService(maxPeople = 100): SessionsService {
  const config = { get: () => maxPeople } as unknown as ConfigService;
  return new SessionsService(config);
}

describe('SessionsService', () => {
  it('knows which logins are open until they end or expire', () => {
    const service = buildService();
    service.start('a', 1, later, now);
    service.start('b', 2, now + 10, now);

    expect(service.isActive('a', now)).toBe(true);
    expect(service.isActive('b', now + 10)).toBe(false);
    service.end('a');
    expect(service.isActive('a', now)).toBe(false);
  });

  it('refuses a new person when the limit of people is reached', () => {
    const service = buildService(2);
    service.start('a', 1, later, now);
    service.start('b', 2, later, now);

    expect(() => service.start('c', 3, later, now)).toThrow(
      'The system is at its limit of 2 people signed in at once',
    );
  });

  it('lets someone who is already signed in log in on another device', () => {
    const service = buildService(2);
    service.start('laptop', 1, later, now);
    service.start('other', 2, later, now);

    service.start('phone', 1, later, now);

    expect(service.isActive('phone', now)).toBe(true);
  });

  it('frees a place when a login expires', () => {
    const service = buildService(1);
    service.start('a', 1, now + 10, now);

    service.start('b', 2, later, now + 20);

    expect(service.isActive('b', now + 20)).toBe(true);
  });
});
