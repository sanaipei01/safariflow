import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { SaveDriverDto } from './save-driver.dto';

const validInput = {
  nationalId: '12345678',
  phone: '0712345678',
  licenseNumber: 'DL-1001',
  licenseExpiry: '2099-12-31',
  psvBadgeNumber: 'PSV-5521',
  vehiclePlate: 'kda123a',
  vehicleMake: 'Toyota',
  vehicleModel: 'HiAce',
  vehicleYear: 2019,
  vehicleCapacity: 14,
  insurancePolicyNumber: 'POL-778',
  insuranceExpiry: '2099-06-30',
};

async function failedFields(input: Record<string, unknown>) {
  const errors = await validate(plainToInstance(SaveDriverDto, input));
  return errors.map((error) => error.property);
}

describe('SaveDriverDto', () => {
  it('accepts a complete registration and stores the plate in one format', async () => {
    const dto = plainToInstance(SaveDriverDto, validInput);

    expect(await validate(dto)).toHaveLength(0);
    expect(dto.vehiclePlate).toBe('KDA 123A');
  });

  it('does not need a Sacco', async () => {
    expect(await failedFields(validInput)).toEqual([]);
  });

  it('accepts the Sacco details the driver wrote', async () => {
    const input = {
      ...validInput,
      saccoName: 'Super Metro',
      saccoRegistrationNumber: 'SAC/001',
      saccoPhone: '+254712345678',
    };

    expect(await failedFields(input)).toEqual([]);
  });

  it('asks for the Sacco name when other Sacco details are given', async () => {
    expect(
      await failedFields({ ...validInput, saccoRegistrationNumber: 'SAC/001' }),
    ).toEqual(['saccoName']);
  });

  it('requires every other field', async () => {
    const fields = Object.keys(validInput).sort();

    expect((await failedFields({})).sort()).toEqual(fields);
  });

  it.each([
    ['nationalId', '123'],
    ['phone', '12345'],
    ['licenseExpiry', '2020-01-01'],
    ['vehiclePlate', 'ABC'],
    ['vehicleYear', 1980],
    ['vehicleCapacity', 71],
    ['insuranceExpiry', 'next year'],
    ['saccoPhone', 'abc'],
  ])('rejects an invalid %s', async (field, value) => {
    const input = { ...validInput, saccoName: 'Super Metro', [field]: value };

    expect(await failedFields(input)).toEqual([field]);
  });
});
