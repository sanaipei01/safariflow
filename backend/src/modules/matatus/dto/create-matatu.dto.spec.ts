import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CreateMatatuDto } from './create-matatu.dto';

const validInput = { plateNumber: 'kda123a', capacity: 33, saccoId: 1 };

async function failedFields(input: Record<string, unknown>) {
  const errors = await validate(plainToInstance(CreateMatatuDto, input));
  return errors.map((error) => error.property);
}

describe('CreateMatatuDto', () => {
  it('accepts a valid matatu and stores the plate in one format', async () => {
    const dto = plainToInstance(CreateMatatuDto, validInput);

    expect(await validate(dto)).toHaveLength(0);
    expect(dto.plateNumber).toBe('KDA 123A');
  });

  it('rejects a plate that is not a Kenyan plate', async () => {
    expect(await failedFields({ ...validInput, plateNumber: 'ABC' })).toEqual([
      'plateNumber',
    ]);
  });

  it.each([0, 71, 14.5])('rejects a capacity of %s', async (capacity) => {
    expect(await failedFields({ ...validInput, capacity })).toEqual([
      'capacity',
    ]);
  });

  it('rejects an unknown status', async () => {
    expect(await failedFields({ ...validInput, status: 'flying' })).toEqual([
      'status',
    ]);
  });

  it('requires a SACCO', async () => {
    expect(
      await failedFields({ plateNumber: 'KDA 123A', capacity: 14 }),
    ).toEqual(['saccoId']);
  });
});
