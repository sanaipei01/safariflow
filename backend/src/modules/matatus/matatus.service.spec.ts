import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { Repository } from 'typeorm';
import { Sacco } from '../saccos/entities/sacco.entity';
import { Matatu } from './entities/matatu.entity';
import { MatatuStatus } from './enums/matatu-status.enum';
import { MatatusService } from './matatus.service';

const SACCO_ID = 1;

function buildMatatu(overrides: Partial<Matatu> = {}): Matatu {
  return {
    id: 1,
    plateNumber: 'KDA 123A',
    capacity: 33,
    status: MatatuStatus.ACTIVE,
    saccoId: SACCO_ID,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  } as Matatu;
}

describe('MatatusService', () => {
  let matatus: Matatu[];
  let existingSaccoIds: number[];
  let service: MatatusService;

  beforeEach(() => {
    matatus = [buildMatatu()];
    existingSaccoIds = [SACCO_ID];

    // Minimal in-memory stand-ins for the two TypeORM repositories.
    const matatusRepository = {
      findOneBy: async ({ plateNumber }: { plateNumber: string }) =>
        matatus.find((matatu) => matatu.plateNumber === plateNumber) ?? null,
      findOne: async ({ where }: { where: { id: number } }) =>
        matatus.find((matatu) => matatu.id === where.id) ?? null,
      create: (data: Partial<Matatu>) => data as Matatu,
      save: async (matatu: Matatu) => {
        matatu.id = matatus.length + 1;
        matatus.push(matatu);
        return matatu;
      },
      update: async (id: number, changes: Partial<Matatu>) => {
        Object.assign(
          matatus.find((matatu) => matatu.id === id) as Matatu,
          changes,
        );
      },
      remove: async (matatu: Matatu) => {
        matatus = matatus.filter((item) => item.id !== matatu.id);
      },
    } as unknown as Repository<Matatu>;

    const saccosRepository = {
      existsBy: async ({ id }: { id: number }) => existingSaccoIds.includes(id),
    } as unknown as Repository<Sacco>;

    service = new MatatusService(matatusRepository, saccosRepository);
  });

  describe('create', () => {
    it('saves a matatu and returns it', async () => {
      const created = await service.create({
        plateNumber: 'KCB 456B',
        capacity: 14,
        saccoId: SACCO_ID,
      });

      expect(created.plateNumber).toBe('KCB 456B');
      expect(matatus).toHaveLength(2);
    });

    it('rejects a plate number that is already registered', async () => {
      await expect(
        service.create({
          plateNumber: 'KDA 123A',
          capacity: 14,
          saccoId: SACCO_ID,
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('rejects a SACCO that does not exist', async () => {
      await expect(
        service.create({ plateNumber: 'KCB 456B', capacity: 14, saccoId: 99 }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('update', () => {
    it('changes only the fields that were sent', async () => {
      const updated = await service.update(1, { capacity: 25 });

      expect(updated.capacity).toBe(25);
      expect(updated.plateNumber).toBe('KDA 123A');
    });

    it('lets a matatu keep its own plate number', async () => {
      await expect(
        service.update(1, { plateNumber: 'KDA 123A' }),
      ).resolves.toBeDefined();
    });

    it('rejects a plate number that belongs to another matatu', async () => {
      matatus.push(buildMatatu({ id: 2, plateNumber: 'KCB 456B' }));

      await expect(
        service.update(1, { plateNumber: 'KCB 456B' }),
      ).rejects.toThrow(ConflictException);
    });

    it('fails for a matatu that does not exist', async () => {
      await expect(service.update(99, { capacity: 14 })).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('remove', () => {
    it('deletes the matatu', async () => {
      await service.remove(1);

      expect(matatus).toHaveLength(0);
    });

    it('fails for a matatu that does not exist', async () => {
      await expect(service.remove(99)).rejects.toThrow(NotFoundException);
    });
  });
});
