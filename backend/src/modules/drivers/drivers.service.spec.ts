import { ConflictException, NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { DriversService } from './drivers.service';
import { DriverDetails } from './dto/save-driver.dto';
import { Driver } from './entities/driver.entity';
import { DriverStatus } from './enums/driver-status.enum';

const registration: DriverDetails = {
  nationalId: '12345678',
  phone: '0712345678',
  licenseNumber: 'DL-1001',
  licenseExpiry: '2099-12-31',
  psvBadgeNumber: 'PSV-5521',
  vehiclePlate: 'KDA 123A',
  vehicleMake: 'Toyota',
  vehicleModel: 'HiAce',
  vehicleYear: 2019,
  vehicleCapacity: 14,
  insurancePolicyNumber: 'POL-778',
  insuranceExpiry: '2099-06-30',
};

function buildDriver(overrides: Partial<Driver> = {}): Driver {
  return {
    id: 1,
    userId: 10,
    ...registration,
    saccoName: null,
    saccoRegistrationNumber: null,
    saccoPhone: null,
    status: DriverStatus.PENDING,
    rejectionReason: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  } as Driver;
}

type Condition = Partial<Driver>;

describe('DriversService', () => {
  let drivers: Driver[];
  let service: DriversService;

  const matches = (driver: Driver, condition: Condition) =>
    Object.entries(condition).every(
      ([field, value]) => driver[field as keyof Driver] === value,
    );

  beforeEach(() => {
    drivers = [buildDriver()];

    // A minimal in-memory stand-in for the TypeORM repository.
    const driversRepository = {
      existsBy: async (condition: Condition) =>
        drivers.some((driver) => matches(driver, condition)),
      findOne: async ({ where }: { where: Condition }) =>
        drivers.find((driver) => matches(driver, where)) ?? null,
      find: async ({ where }: { where: Condition | Condition[] }) =>
        drivers.filter((driver) =>
          [where].flat().some((condition) => matches(driver, condition)),
        ),
      create: (data: Partial<Driver>) =>
        buildDriver({ ...data, id: drivers.length + 1 }),
      save: async (driver: Driver) => {
        drivers.push(driver);
        return driver;
      },
      update: async (id: number, changes: Partial<Driver>) => {
        Object.assign(
          drivers.find((driver) => driver.id === id) as Driver,
          changes,
        );
      },
    } as unknown as Repository<Driver>;

    service = new DriversService(driversRepository);
  });

  const otherDriver = (overrides: Partial<Driver>) =>
    buildDriver({
      id: 2,
      userId: 11,
      nationalId: '87654321',
      licenseNumber: 'DL-2002',
      vehiclePlate: 'KCB 456B',
      ...overrides,
    });

  const newDetails = (overrides: Partial<DriverDetails> = {}) => ({
    ...registration,
    nationalId: '87654321',
    licenseNumber: 'DL-2002',
    vehiclePlate: 'KCB 456B',
    ...overrides,
  });

  describe('register', () => {
    it('creates a pending registration with the driver, vehicle and Sacco details', async () => {
      const driver = await service.register(
        11,
        newDetails({ saccoName: 'Super Metro', saccoPhone: '0722000000' }),
      );

      expect(driver).toMatchObject({
        userId: 11,
        status: DriverStatus.PENDING,
        vehiclePlate: 'KCB 456B',
        saccoName: 'Super Metro',
        saccoRegistrationNumber: null,
        saccoPhone: '0722000000',
      });
    });

    it('works for a driver who belongs to no Sacco', async () => {
      const driver = await service.register(11, newDetails());

      expect(driver.saccoName).toBeNull();
    });

    it('rejects a user who already has a registration', async () => {
      await expect(service.register(10, newDetails())).rejects.toThrow(
        ConflictException,
      );
    });

    it.each([
      ['licence number', { licenseNumber: 'DL-1001' }],
      ['national ID', { nationalId: '12345678' }],
      ['vehicle plate', { vehiclePlate: 'KDA 123A' }],
    ])('rejects a %s that is already registered', async (field, taken) => {
      await expect(service.register(11, newDetails(taken))).rejects.toThrow(
        `This ${field} is already registered`,
      );
    });
  });

  describe('findMine', () => {
    it('returns the registration of the signed-in driver', async () => {
      await expect(service.findMine(10)).resolves.toMatchObject({ id: 1 });
    });

    it('fails when the driver has not registered', async () => {
      await expect(service.findMine(99)).rejects.toThrow(NotFoundException);
    });
  });

  describe('findAll', () => {
    it('lists every registration, or only those with the chosen status', async () => {
      drivers.push(otherDriver({ status: DriverStatus.APPROVED }));

      await expect(service.findAll({})).resolves.toHaveLength(2);
      await expect(
        service.findAll({ status: DriverStatus.APPROVED }),
      ).resolves.toHaveLength(1);
    });
  });

  describe('approve and reject', () => {
    it('approves a pending registration', async () => {
      const driver = await service.approve(1);

      expect(driver.status).toBe(DriverStatus.APPROVED);
    });

    it('rejects a pending registration and keeps the reason', async () => {
      const driver = await service.reject(1, 'Licence photo unreadable');

      expect(driver.status).toBe(DriverStatus.REJECTED);
      expect(driver.rejectionReason).toBe('Licence photo unreadable');
    });

    it('does not decide a registration twice', async () => {
      await service.approve(1);

      await expect(service.reject(1, 'Changed my mind')).rejects.toThrow(
        ConflictException,
      );
    });

    it('fails for a driver that does not exist', async () => {
      await expect(service.approve(99)).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateMine', () => {
    it('sends a rejected registration back to pending without the old reason', async () => {
      await service.reject(1, 'Wrong plate');

      const driver = await service.updateMine(10, {
        ...registration,
        vehiclePlate: 'KDB 789C',
      });

      expect(driver.vehiclePlate).toBe('KDB 789C');
      expect(driver.status).toBe(DriverStatus.PENDING);
      expect(driver.rejectionReason).toBeNull();
    });

    it('clears Sacco details the driver removes', async () => {
      drivers[0].saccoName = 'Super Metro';
      await service.reject(1, 'Wrong Sacco');

      const driver = await service.updateMine(10, registration);

      expect(driver.saccoName).toBeNull();
    });

    it('does not let an approved driver change their details', async () => {
      await service.approve(1);

      await expect(service.updateMine(10, registration)).rejects.toThrow(
        ConflictException,
      );
    });

    it('rejects details that belong to another driver', async () => {
      drivers.push(otherDriver({}));

      await expect(
        service.updateMine(10, { ...registration, licenseNumber: 'DL-2002' }),
      ).rejects.toThrow(ConflictException);
    });
  });
});
