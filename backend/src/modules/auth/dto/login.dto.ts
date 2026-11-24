import { IsEmail, IsNotEmpty, IsString } from 'class-validator';
import { NormalizeEmail } from '../../../common/decorators/normalize-email.decorator';
import { EMAIL_MESSAGE } from '../password-rules';

export class LoginDto {
  @NormalizeEmail()
  @IsEmail({}, { message: EMAIL_MESSAGE })
  email: string;

  @IsString()
  @IsNotEmpty()
  password: string;
}
