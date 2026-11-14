import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { Role } from '../../common/enums/role.enum';
import { User } from '../users/entities/user.entity';
import { UsersService } from '../users/users.service';
import { AuthService } from './auth.service';

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
  let signedPayload: unknown;
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
      signAsync: async (payload: unknown) => {
        signedPayload = payload;
        return 'signed-token';
      },
    } as unknown as JwtService;

    service = new AuthService(usersService, jwtService);
  });

  describe('login', () => {
    it('returns a token and the user for valid credentials', async () => {
      const result = await service.login({
        email: 'driver@safariflow.test',
        password: PASSWORD,
      });

      expect(result.accessToken).toBe('signed-token');
      expect(result.user.email).toBe('driver@safariflow.test');
      expect(signedPayload).toEqual({ sub: 1, role: Role.DRIVER });
    });

    it('never returns the password hash', async () => {
      const result = await service.login({
        email: 'driver@safariflow.test',
        password: PASSWORD,
      });

      expect(result.user).not.toHaveProperty('passwordHash');
    });

    it('rejects a wrong password', async () => {
      await expect(
        service.login({ email: 'driver@safariflow.test', password: 'wrong' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('rejects an unknown email with the same error as a wrong password', async () => {
      storedUser = null;

      await expect(
        service.login({ email: 'nobody@safariflow.test', password: PASSWORD }),
      ).rejects.toThrow('Invalid email or password');
    });

    it('rejects a deactivated account', async () => {
      storedUser = buildUser({ passwordHash, isActive: false });

      await expect(
        service.login({ email: 'driver@safariflow.test', password: PASSWORD }),
      ).rejects.toThrow(UnauthorizedException);
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
});
