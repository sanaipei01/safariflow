import { Transform } from 'class-transformer';
import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
  ValidateIf,
} from 'class-validator';
import { Trim } from '../../../common/decorators/trim.decorator';
import { IsFutureDate } from '../../../common/validators/is-future-date.validator';
import {
  PLATE_NUMBER_PATTERN,
  normalizePlateNumber,
} from '../../matatus/utils/plate-number';

const KENYAN_PHONE = /^(\+254|0)[17]\d{8}$/;
const NATIONAL_ID = /^\d{7,8}$/;
const OLDEST_VEHICLE_YEAR = 1990;

const isGiven = (value: unknown): boolean =>
  value !== undefined && value !== null;

/** Used when a driver registers and when a rejected driver corrects their details. */
export class SaveDriverDto {
  // personal details
  @Trim()
  @Matches(NATIONAL_ID, { message: 'nationalId must be 7 or 8 digits' })
  nationalId: string;

  @Trim()
  @Matches(KENYAN_PHONE, {
    message: 'phone must look like 0712345678 or +254712345678',
  })
  phone: string;

  // driving licence
  @Trim()
  @IsString()
  @IsNotEmpty()
  @MaxLength(30)
  licenseNumber: string;

  @IsFutureDate()
  licenseExpiry: string;

  @Trim()
  @IsString()
  @IsNotEmpty()
  @MaxLength(30)
  psvBadgeNumber: string;

  // vehicle
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? normalizePlateNumber(value) : value,
  )
  @Matches(PLATE_NUMBER_PATTERN, {
    message: 'vehiclePlate must look like KDA 123A',
  })
  vehiclePlate: string;

  @Trim()
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  vehicleMake: string;

  @Trim()
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  vehicleModel: string;

  @IsInt()
  @Min(OLDEST_VEHICLE_YEAR)
  @Max(new Date().getFullYear() + 1)
  vehicleYear: number;

  @IsInt()
  @Min(1)
  @Max(70)
  vehicleCapacity: number;

  @Trim()
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  insurancePolicyNumber: string;

  @IsFutureDate()
  insuranceExpiry: string;

  // Sacco: optional, but a registration number or phone needs a name
  @ValidateIf(
    (dto: SaveDriverDto) =>
      isGiven(dto.saccoName) ||
      isGiven(dto.saccoRegistrationNumber) ||
      isGiven(dto.saccoPhone),
  )
  @Trim()
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  saccoName?: string;

  @IsOptional()
  @Trim()
  @IsString()
  @MaxLength(50)
  saccoRegistrationNumber?: string;

  @IsOptional()
  @Trim()
  @Matches(KENYAN_PHONE, {
    message: 'saccoPhone must look like 0712345678 or +254712345678',
  })
  saccoPhone?: string;
}

/** The registration as plain data, which can be copied and spread safely. */
export type DriverDetails = Pick<SaveDriverDto, keyof SaveDriverDto>;
