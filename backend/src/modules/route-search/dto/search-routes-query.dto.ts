import { IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { Trim } from '../../../common/decorators/trim.decorator';

export class SearchRoutesQueryDto {
  @Trim()
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  from: string;

  @Trim()
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  to: string;
}
