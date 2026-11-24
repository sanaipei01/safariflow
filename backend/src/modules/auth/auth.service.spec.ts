import {
  ConflictException,
  HttpException,
  HttpStatus,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { Role } from '../../common/enums/role.enum';
import { User } from '../users/entities/user.entity';
import { UsersService } from '../users/users.service';
import { AuthService } from './auth.service';
import {
  LoginAttemptsService,
  MAX_FAILED_LOGINS,
} from './login-attempts.service';
import { SessionsService } from './sessions.service';

const PASSWORD = 'Password123!';

function buildUser(overrides: Partial<User> = {}): User {
  return {
    id: 1,
    name: 'Demo Driver',
    email: 'driver@safariflow.test',
    phone: null,
    passwordHash: '',
    role: Role.DRIVER,
    isActive: true,
    ...overrides,
  } as User;
}

describe('AuthService', () => {
  let passwordHash: string;
  let storedUser: User | null;
  let createdUser: Partial<User> | null;
  let signedPayload: { sid?: string } | null;
  let sessions: SessionsService;
  let service: AuthService;

  beforeAll(async () => {
    // a low cost factor keeps the test fast; production uses 10 rounds
    passwordHash = await bcrypt.hash(PASSWORD, 4);
  });

  beforeEach(() => {
    storedUser = buildUser({ passwordHash });
    createdUser = null;
    signedPayload = null;

    const usersService = {
      findByEmail: async () => storedUser,
      findByEmailWithPassword: async () => storedUser,
      create: async (data: Partial<User>) => {
        createdUser = data;
        return buildUser({ ...data, id: 2 });
      },
    } as unknown as UsersService;

    const jwtService = {
      signAsync: async (payload: { sid?: string }) => {
        signedPayload = payload;
        return 'signed-token';
      },
      decode: (token: string) =>
        token === 'signed-token'
          ? { exp: Date.now() / 1000 + 3600, sid: signedPayload?.sid }
          : null,
    } as unknown as JwtService;

    sessions = new SessionsService({
      get: (_key: string, fallback: unknown) => fallback,
    } as unknown as ConfigService);
    service = new AuthService(
      usersService,
      jwtService,
      new LoginAttemptsService(),
      sessions,
    );
  });

  describe('login', () => {
    it('returns a token and the user for valid credentials', async () => {
      const result = await service.login({
        email: 'driver@safariflow.test',
        password: PASSWORD,
      });

      expect(result.accessToken).toBe('signed-token');
      expect(result.user.email).toBe('driver@safariflow.test');
      expect(signedPayload).toEqual({
        sub: 1,
        role: Role.DRIVER,
        sid: expect.any(String),
      });
    });

    it('never returns the password hash', async () => {
      const result = await service.login({
        email: 'driver@safariflow.test',
        password: PASSWORD,
      });

      expect(result.user).not.toHaveProperty('passwordHash');
    });

    it('rejects a wrong password and says the password is the problem', async () => {
      await expect(
        service.login({ email: 'driver@safariflow.test', password: 'wrong' }),
      ).rejects.toThrow('Incorrect password.');
    });

    it('rejects an unknown email and says the email is the problem', async () => {
      storedUser = null;

      await expect(
        service.login({ email: 'nobody@safariflow.test', password: PASSWORD }),
      ).rejects.toThrow('No account was found with this email.');
    });

    it('says how many attempts are left after each wrong password', async () => {
      const login = () =>
        service.login({ email: 'driver@safariflow.test', password: 'wrong' });

      await expect(login()).rejects.toThrow(
        `Incorrect password. You have ${MAX_FAILED_LOGINS - 1} attempts left.`,
      );
      await expect(login()).rejects.toThrow(
        `You have ${MAX_FAILED_LOGINS - 2} attempts left.`,
      );
    });

    it('locks the account after too many wrong passwords, even for the right one', async () => {
      const email = 'driver@safariflow.test';
      for (let i = 0; i < MAX_FAILED_LOGINS - 1; i++) {
        await expect(
          service.login({ email, password: 'wrong' }),
        ).rejects.toThrow(UnauthorizedException);
      }

      await expect(service.login({ email, password: 'wrong' })).rejects.toThrow(
        new HttpException(
          'Too many failed login attempts. Try again in 15 minutes.',
          HttpStatus.TOO_MANY_REQUESTS,
        ),
      );
      await expect(
        service.login({ email, password: PASSWORD }),
      ).rejects.toThrow('Too many failed login attempts');
    });

    it('starts counting again after a successful login', async () => {
      const email = 'driver@safariflow.test';
      await expect(service.login({ email, password: 'wrong' })).rejects.toThrow(
        UnauthorizedException,
      );
      await service.login({ email, password: PASSWORD });

      await expect(service.login({ email, password: 'wrong' })).rejects.toThrow(
        `You have ${MAX_FAILED_LOGINS - 1} attempts left.`,
      );
    });

    it('rejects a deactivated account and says so', async () => {
      storedUser = buildUser({ passwordHash, isActive: false });

      await expect(
        service.login({ email: 'driver@safariflow.test', password: PASSWORD }),
      ).rejects.toThrow('This account has been deactivated.');
    });
  });

  describe('register', () => {
    it('stores a lowercase email, a hashed password and the passenger role by default', async () => {
      storedUser = null;

      await service.register({
        name: 'New Passenger',
        email: 'New@Example.com',
        password: PASSWORD,
      });

      expect(createdUser?.email).toBe('new@example.com');
      expect(createdUser?.role).toBe(Role.PASSENGER);
      expect(createdUser?.passwordHash).not.toBe(PASSWORD);
      expect(await bcrypt.compare(PASSWORD, createdUser!.passwordHash!)).toBe(
        true,
      );
    });

    it('rejects an email that is already registered', async () => {
      await expect(
        service.register({
          name: 'Duplicate',
          email: 'driver@safariflow.test',
          password: PASSWORD,
        }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('sessions', () => {
    it('opens a session on login and closes it on logout', async () => {
      await service.login({
        email: 'driver@safariflow.test',
        password: PASSWORD,
      });
      const sid = signedPayload?.sid as string;
      expect(sessions.isActive(sid)).toBe(true);

      service.logout('Bearer signed-token');

      expect(sessions.isActive(sid)).toBe(false);
    });
  });
});
