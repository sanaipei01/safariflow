export enum Role {
  ADMIN = 'admin',
  OPERATOR = 'operator',
  DRIVER = 'driver',
  PASSENGER = 'passenger',
}

export interface User {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  role: Role;
  isActive: boolean;
}
