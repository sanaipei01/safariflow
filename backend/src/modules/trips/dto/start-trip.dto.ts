import { IsInt, IsPositive } from 'class-validator';

export class StartTripDto {
  @IsInt()
  @IsPositive()
  routeId: number;
}
