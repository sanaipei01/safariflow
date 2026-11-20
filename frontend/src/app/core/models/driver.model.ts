import { User } from './user.model';

export type DriverStatus = 'pending' | 'approved' | 'rejected';

export const DRIVER_STATUSES: readonly DriverStatus[] = ['pending', 'approved', 'rejected'];

/** The statuses as dropdown options, with a capital first letter for display. */
export const DRIVER_STATUS_OPTIONS = DRIVER_STATUSES.map((status) => ({
  label: status.charAt(0).toUpperCase() + status.slice(1),
  value: status,
}));

/** The colour of the status tag wherever a driver's status is shown. */
export const DRIVER_STATUS_SEVERITY: Record<DriverStatus, 'warn' | 'success' | 'danger'> = {
  pending: 'warn',
  approved: 'success',
  rejected: 'danger',
};

/** Everything a driver gives when registering. Dates are written as YYYY-MM-DD. */
export interface DriverRegistration {
  nationalId: string;
  phone: string;
  licenseNumber: string;
  licenseExpiry: string;
  psvBadgeNumber: string;
  vehiclePlate: string;
  vehicleMake: string;
  vehicleModel: string;
  vehicleYear: number;
  vehicleCapacity: number;
  insurancePolicyNumber: string;
  insuranceExpiry: string;
  // The Sacco is optional and is only what the driver wrote.
  saccoName?: string;
  saccoRegistrationNumber?: string;
  saccoPhone?: string;
}

export interface Driver extends Omit<
  DriverRegistration,
  'saccoName' | 'saccoRegistrationNumber' | 'saccoPhone'
> {
  id: number;
  userId: number;
  user: Pick<User, 'name' | 'email' | 'phone'>;
  saccoName: string | null;
  saccoRegistrationNumber: string | null;
  saccoPhone: string | null;
  status: DriverStatus;
  rejectionReason: string | null;
}
