import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

// Who is signed in right now. Kept in memory, so a restart signs everyone out.
@Injectable()
export class SessionsService {
  private readonly sessions = new Map<
    string,
    { userId: number; expiresAt: number }
  >();
  private readonly maxPeople: number;

  constructor(config: ConfigService) {
    this.maxPeople = Number(config.get('MAX_ACTIVE_SESSIONS', 100));
  }

  start(id: string, userId: number, expiresAt: number, now = Date.now()): void {
    const people = this.signedInUsers(now);
    if (!people.has(userId) && people.size >= this.maxPeople) {
      throw new HttpException(
        `The system is at its limit of ${this.maxPeople} people signed in at once. Please try again shortly.`,
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
    this.sessions.set(id, { userId, expiresAt });
  }

  isActive(id: string, now = Date.now()): boolean {
    return (this.sessions.get(id)?.expiresAt ?? 0) > now;
  }

  end(id: string): void {
    this.sessions.delete(id);
  }

  private signedInUsers(now: number): Set<number> {
    const users = new Set<number>();
    for (const [id, session] of this.sessions) {
      if (session.expiresAt > now) {
        users.add(session.userId);
      } else {
        this.sessions.delete(id);
      }
    }
    return users;
  }
}
