import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { RegisterDto } from './register.dto';

const validInput = {
  name: 'New Passenger',
  email: 'new@example.com',
  password: 'Password123!',
};

async function failedFields(input: Record<string, unknown>) {
  const errors = await validate(plainToInstance(RegisterDto, input));
  return errors.map((error) => error.property);
}

describe('RegisterDto', () => {
  it('accepts a valid registration and stores the email in lowercase', async () => {
    const dto = plainToInstance(RegisterDto, {
      ...validInput,
      email: '  New@Example.COM ',
    });

    expect(await validate(dto)).toEqual([]);
    expect(dto.email).toBe('new@example.com');
  });

  it.each([
    'Ab1!',
    'password123!',
    'PASSWORD123!',
    'Password!!!!',
    'Password1234',
    `Aa1!${'x'.repeat(70)}`,
  ])('rejects the password %s', async (password) => {
    expect(await failedFields({ ...validInput, password })).toEqual([
      'password',
    ]);
  });

  it.each(['plain', 'a@b', 'a b@example.com', '@example.com'])(
    'rejects the email %s',
    async (email) => {
      expect(await failedFields({ ...validInput, email })).toEqual(['email']);
    },
  );

  it('only lets people register as a passenger or a driver', async () => {
    expect(await failedFields({ ...validInput, role: 'admin' })).toEqual([
      'role',
    ]);
  });
});
