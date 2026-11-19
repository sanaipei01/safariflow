import { ConflictException, NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { Matatu } from '../matatus/entities/matatu.entity';
import { Sacco } from './entities/sacco.entity';
import { SaccosService } from './saccos.service';

function buildSacco(overrides: Partial<Sacco> = {}): Sacco {
  return {
    id: 1,
    name: 'Super Metro',
    registrationNumber: 'SAC/001',
    phone: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

describe('SaccosService', () => {
  let saccos: Sacco[];
  let saccoHasMatatus: boolean;
  let service: SaccosService;

  beforeEach(() => {
    saccos = [buildSacco()];
    saccoHasMatatus = false;

    // Minimal in-memory stand-ins for the two TypeORM repositories.
    const saccosRepository = {
      find: async ({ where }: { where: Partial<Sacco>[] }) =>
        saccos.filter((sacco) =>
          where.some((condition) =>
            Object.entries(condition).every(
              ([key, value]) => sacco[key as keyof Sacco] === value,
            ),
          ),
        ),
      findOneBy: async ({ id }: { id: number }) =>
        saccos.find((sacco) => sacco.id === id) ?? null,
      create: (data: Partial<Sacco>) => data as Sacco,
      save: async (sacco: Sacco) => {
        if (!sacco.id) {
          sacco.id = saccos.length + 1;
          saccos.push(sacco);
        }
        return sacco;
      },
      remove: async (sacco: Sacco) => {
        saccos = saccos.filter((item) => item.id !== sacco.id);
      },
    } as unknown as Repository<Sacco>;

    const matatusRepository = {
      existsBy: async () => saccoHasMatatus,
    } as unknown as Repository<Matatu>;

    service = new SaccosService(saccosRepository, matatusRepository);
  });

  describe('create', () => {
    it('saves a new SACCO', async () => {
      const created = await service.create({
        name: 'Metro Trans',
        registrationNumber: 'SAC/002',
      });

      expect(created.id).toBe(2);
      expect(saccos).toHaveLength(2);
    });

    it('rejects a name that is already used', async () => {
      await expect(
        service.create({ name: 'Super Metro', registrationNumber: 'SAC/009' }),
      ).rejects.toThrow('A SACCO with this name already exists');
    });

    it('rejects a registration number that is already used', async () => {
      await expect(
        service.create({ name: 'Other', registrationNumber: 'SAC/001' }),
      ).rejects.toThrow('registration number already exists');
    });
  });

  describe('update', () => {
    it('lets a SACCO keep its own name', async () => {
      const updated = await service.update(1, { name: 'Super Metro' });

      expect(updated.name).toBe('Super Metro');
    });

    it('rejects a name that belongs to another SACCO', async () => {
      saccos.push(
        buildSacco({
          id: 2,
          name: 'Metro Trans',
          registrationNumber: 'SAC/002',
        }),
      );

      await expect(service.update(2, { name: 'Super Metro' })).rejects.toThrow(
        ConflictException,
      );
    });

    it('fails for a SACCO that does not exist', async () => {
      await expect(service.update(99, { phone: '0712345678' })).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('remove', () => {
    it('deletes a SACCO that has no matatus', async () => {
      await service.remove(1);

      expect(saccos).toHaveLength(0);
    });

    it('refuses to delete a SACCO that still has matatus', async () => {
      saccoHasMatatus = true;

      await expect(service.remove(1)).rejects.toThrow(ConflictException);
      expect(saccos).toHaveLength(1);
    });
  });
});
