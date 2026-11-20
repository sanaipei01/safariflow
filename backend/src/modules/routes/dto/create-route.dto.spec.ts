import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CreateRouteDto } from './create-route.dto';

const build = (body: object) => plainToInstance(CreateRouteDto, body);
const isValid = async (body: object) =>
  (await validate(build(body))).length === 0;

const valid = { name: 'Nairobi - Thika', stages: ['Nairobi CBD', 'Thika'] };

describe('CreateRouteDto', () => {
  it('accepts a name and at least two stages', async () => {
    expect(await isValid(valid)).toBe(true);
  });

  it('removes spaces around the name and around every stage', () => {
    const dto = build({
      name: '  Nairobi - Thika ',
      stages: [' CBD ', 'Thika  '],
    });

    expect(dto.name).toBe('Nairobi - Thika');
    expect(dto.stages).toEqual(['CBD', 'Thika']);
  });

  it('needs at least two stages', async () => {
    expect(await isValid({ ...valid, stages: ['Thika'] })).toBe(false);
    expect(await isValid({ ...valid, stages: [] })).toBe(false);
  });

  it('rejects an empty or blank stage name', async () => {
    expect(await isValid({ ...valid, stages: ['Thika', '   '] })).toBe(false);
  });

  it('rejects a missing name or missing stages', async () => {
    expect(await isValid({ stages: valid.stages })).toBe(false);
    expect(await isValid({ name: valid.name })).toBe(false);
  });

  it('only accepts true or false for isActive', async () => {
    expect(await isValid({ ...valid, isActive: false })).toBe(true);
    expect(await isValid({ ...valid, isActive: 'no' })).toBe(false);
  });
});
