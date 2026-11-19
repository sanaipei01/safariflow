import {
  IsEmail,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { Role } from '../../../common/enums/role.enum';

export const SELF_REGISTRATION_ROLES = [Role.PASSENGER, Role.DRIVER] as const;

export class RegisterDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;

  @IsEmail()
  email: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  phone?: string;

  // bcrypt only uses the first 72 bytes of a password
  @IsString()
  @MinLength(8)
  @MaxLength(72)
  password: string;

  @IsOptional()
  @IsIn(SELF_REGISTRATION_ROLES)
  role?: (typeof SELF_REGISTRATION_ROLES)[number];
}
