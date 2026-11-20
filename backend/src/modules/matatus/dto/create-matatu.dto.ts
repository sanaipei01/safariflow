import { Transform } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, Matches, Max, Min } from 'class-validator';
import { MatatuStatus } from '../enums/matatu-status.enum';
import {
  PLATE_NUMBER_PATTERN,
  normalizePlateNumber,
} from '../utils/plate-number';

export class CreateMatatuDto {
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? normalizePlateNumber(value) : value,
  )
  @Matches(PLATE_NUMBER_PATTERN, {
    message: 'plateNumber must look like KDA 123A',
  })
  plateNumber: string;

  @IsInt()
  @Min(1)
  @Max(70)
  capacity: number;

  @IsOptional()
  @IsEnum(MatatuStatus)
  status?: MatatuStatus;

  @IsInt()
  @Min(1)
  saccoId: number;
}
