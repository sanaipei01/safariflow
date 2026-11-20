import { IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { Trim } from '../../../common/decorators/trim.decorator';

export class RejectDriverDto {
  @Trim()
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  reason: string;
}
