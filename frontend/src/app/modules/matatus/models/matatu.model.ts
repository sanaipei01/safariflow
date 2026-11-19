import { Sacco } from '../../../core/models/sacco.model';

export type MatatuStatus = 'active' | 'maintenance' | 'inactive';

export const MATATU_STATUSES: readonly MatatuStatus[] = ['active', 'maintenance', 'inactive'];

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
