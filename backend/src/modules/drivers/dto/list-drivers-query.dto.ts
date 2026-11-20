import { IsEnum, IsOptional } from 'class-validator';
import { DriverStatus } from '../enums/driver-status.enum';

export class ListDriversQueryDto {
  @IsOptional()
  @IsEnum(DriverStatus)
  status?: DriverStatus;
}
