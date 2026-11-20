import { Sacco } from '../../../core/models/sacco.model';

export type MatatuStatus = 'active' | 'maintenance' | 'inactive';

export const MATATU_STATUSES: readonly MatatuStatus[] = ['active', 'maintenance', 'inactive'];

/** The statuses as dropdown options, with a capital first letter for display. */
export const MATATU_STATUS_OPTIONS = MATATU_STATUSES.map((status) => ({
  label: status.charAt(0).toUpperCase() + status.slice(1),
  value: status,
}));

export interface Matatu {
  id: number;
  plateNumber: string;
  capacity: number;
  status: MatatuStatus;
  saccoId: number;
  sacco: Sacco;
}

export interface MatatuFilters {
  saccoId?: number;
  status?: MatatuStatus;
}

export interface SaveMatatuRequest {
  plateNumber: string;
  capacity: number;
  status: MatatuStatus;
  saccoId: number;
}
