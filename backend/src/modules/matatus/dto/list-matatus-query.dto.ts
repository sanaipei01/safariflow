import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, Min } from 'class-validator';
import { MatatuStatus } from '../enums/matatu-status.enum';

export class ListMatatusQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  saccoId?: number;

  @IsOptional()
  @IsEnum(MatatuStatus)
  status?: MatatuStatus;
}
