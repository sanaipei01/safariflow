import {
  ConflictException,
  HttpException,
  HttpStatus,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { randomUUID } from 'node:crypto';
import { QueryFailedError } from 'typeorm';
import { Role } from '../../common/enums/role.enum';
import { JwtPayload } from '../../common/interfaces/jwt-payload.interface';
import { User } from '../users/entities/user.entity';
import { UsersService } from '../users/users.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { LoginAttemptsService } from './login-attempts.service';
import { SessionsService } from './sessions.service';

const PASSWORD_SALT_ROUNDS = 10;

export interface AuthResponse {
  accessToken: string;
  user: User;
}

const attemptsText = (count: number) =>
  `${count} attempt${count === 1 ? '' : 's'}`;

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly loginAttempts: LoginAttemptsService,
    private readonly sessions: SessionsService,
  ) {}

  async register(dto: RegisterDto): Promise<AuthResponse> {
    const email = dto.email.toLowerCase();
    const emailTaken = new ConflictException(
      'An account with this email already exists',
    );
    if (await this.usersService.findByEmail(email)) {
      throw emailTaken;
    }

    try {
      const user = await this.usersService.create({
        name: dto.name,
        email,
        phone: dto.phone ?? null,
        passwordHash: await bcrypt.hash(dto.password, PASSWORD_SALT_ROUNDS),
        role: dto.role ?? Role.PASSENGER,
      });
      return await this.buildAuthResponse(user);
    } catch (error) {
      // two sign-ups with one email at the same moment: the database refuses the second
      const driverError = (error as QueryFailedError).driverError as
        { code?: string } | undefined;
      if (driverError?.code === 'SQLITE_CONSTRAINT_UNIQUE') {
        throw emailTaken;
      }
      throw error;
    }
  }

  async login(dto: LoginDto): Promise<AuthResponse> {
    const email = dto.email.toLowerCase();
    this.assertNotLocked(email);

    const user = await this.usersService.findByEmailWithPassword(email);
    if (!user) {
      throw new UnauthorizedException(
        'No account was found with this email. Check it or register.',
      );
    }
    if (!user.isActive) {
      throw new UnauthorizedException(
        'This account has been deactivated. Contact the operator.',
      );
    }
    if (!(await bcrypt.compare(dto.password, user.passwordHash))) {
      const attemptsLeft = this.loginAttempts.recordFailure(email);
      this.assertNotLocked(email);
      throw new UnauthorizedException(
        `Incorrect password. You have ${attemptsText(attemptsLeft)} left.`,
      );
    }

    this.loginAttempts.reset(email);
    return this.buildAuthResponse(user);
  }

  logout(authorization?: string): void {
    const token = authorization?.replace(/^Bearer\s+/i, '') ?? '';
    const payload = this.jwtService.decode<Partial<JwtPayload> | null>(token);
    if (payload?.sid) {
      this.sessions.end(payload.sid);
    }
  }

  private assertNotLocked(email: string): void {
    const waitMs = this.loginAttempts.lockRemainingMs(email);
    if (waitMs > 0) {
      const minutes = Math.ceil(waitMs / 60_000);
      throw new HttpException(
        `Too many failed login attempts. Try again in ${minutes} ${minutes === 1 ? 'minute' : 'minutes'}.`,
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
  }

  private async buildAuthResponse(user: User): Promise<AuthResponse> {
    const sid = randomUUID();
    const payload: JwtPayload = { sub: user.id, role: user.role, sid };
    const accessToken = await this.jwtService.signAsync(payload);
    const { exp } = this.jwtService.decode<{ exp: number }>(accessToken);
    this.sessions.start(sid, user.id, exp * 1000);

    // never send the password hash back to the client
    const { passwordHash: _passwordHash, ...safeUser } = user;
    return { accessToken, user: safeUser as User };
  }
}
