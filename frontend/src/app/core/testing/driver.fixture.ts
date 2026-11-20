import { Driver } from '../models/driver.model';

/** A pending driver registration with every field filled, for tests that need one. */
export function buildDriver(overrides: Partial<Driver> = {}): Driver {
  return {
    id: 1,
    userId: 10,
    user: { name: 'Demo Driver', email: 'driver@safariflow.test', phone: null },
    nationalId: '12345678',
    phone: '0712345678',
    licenseNumber: 'DL-1001',
    licenseExpiry: '2030-12-31',
    psvBadgeNumber: 'PSV-5521',
    vehiclePlate: 'KDA 123A',
    vehicleMake: 'Toyota',
    vehicleModel: 'HiAce',
    vehicleYear: 2019,
    vehicleCapacity: 14,
    insurancePolicyNumber: 'POL-778',
    insuranceExpiry: '2030-06-30',
    saccoName: 'Super Metro',
    saccoRegistrationNumber: 'SAC/001',
    saccoPhone: null,
    status: 'pending',
    rejectionReason: null,
    ...overrides,
  };
}
