import { IsInt, Min } from 'class-validator';

export class ApproveDriverDto {
  /** The Sacco the driver's vehicle is added to in the Matatus list. */
  @IsInt()
  @Min(1)
  saccoId: number;
}
