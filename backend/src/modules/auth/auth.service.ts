import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { JwtPayload } from '../../common/interfaces/jwt-payload.interface';
import { Role } from '../../common/enums/role.enum';
import { User } from '../users/entities/user.entity';
import { UsersService } from '../users/users.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

const PASSWORD_SALT_ROUNDS = 10;

export interface AuthResponse {
  accessToken: string;
  user: User;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto): Promise<AuthResponse> {
    const email = dto.email.toLowerCase();
    if (await this.usersService.findByEmail(email)) {
      throw new ConflictException('An account with this email already exists');
    }

    const user = await this.usersService.create({
      name: dto.name,
      email,
      phone: dto.phone ?? null,
      passwordHash: await bcrypt.hash(dto.password, PASSWORD_SALT_ROUNDS),
      role: dto.role ?? Role.PASSENGER,
    });

    return this.buildAuthResponse(user);
  }

  async login(dto: LoginDto): Promise<AuthResponse> {
    const user = await this.usersService.findByEmailWithPassword(
      dto.email.toLowerCase(),
    );
    const passwordMatches =
      !!user && (await bcrypt.compare(dto.password, user.passwordHash));

    if (!user || !passwordMatches || !user.isActive) {
      throw new UnauthorizedException('Invalid email or password');
    }

    return this.buildAuthResponse(user);
  }

  private async buildAuthResponse(user: User): Promise<AuthResponse> {
    const payload: JwtPayload = { sub: user.id, role: user.role };
    // never send the password hash back to the client
    const { passwordHash: _passwordHash, ...safeUser } = user;
    return {
      accessToken: await this.jwtService.signAsync(payload),
      user: safeUser as User,
    };
  }
}
