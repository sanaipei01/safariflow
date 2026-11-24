import {
  IsEmail,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
} from 'class-validator';
import { NormalizeEmail } from '../../../common/decorators/normalize-email.decorator';
import { Role } from '../../../common/enums/role.enum';
import {
  EMAIL_MAX_LENGTH,
  EMAIL_MESSAGE,
  PASSWORD_PATTERN,
  PASSWORD_RULES_MESSAGE,
} from '../password-rules';

export const SELF_REGISTRATION_ROLES = [Role.PASSENGER, Role.DRIVER] as const;

export class RegisterDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;

  @NormalizeEmail()
  @IsEmail({}, { message: EMAIL_MESSAGE })
  @MaxLength(EMAIL_MAX_LENGTH)
  email: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  phone?: string;

  @IsString()
  @Matches(PASSWORD_PATTERN, { message: PASSWORD_RULES_MESSAGE })
  password: string;

  @IsOptional()
  @IsIn(SELF_REGISTRATION_ROLES)
  role?: (typeof SELF_REGISTRATION_ROLES)[number];
}
