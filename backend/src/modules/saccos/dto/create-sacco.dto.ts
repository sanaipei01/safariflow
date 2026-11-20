import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import { Trim } from '../../../common/decorators/trim.decorator';

export class CreateSaccoDto {
  @Trim()
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;

  @Trim()
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  registrationNumber: string;

  @IsOptional()
  @Trim()
  @IsString()
  @MaxLength(20)
  phone?: string;
}
