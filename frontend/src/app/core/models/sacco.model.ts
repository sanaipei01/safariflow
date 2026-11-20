export interface Sacco {
  id: number;
  name: string;
  registrationNumber: string;
  phone: string | null;
}

/** What the operator types when adding or editing a Sacco. The phone is optional. */
export interface SaccoInput {
  name: string;
  registrationNumber: string;
  phone?: string;
}
