import { Role, User } from './user.model';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  phone?: string;
  password: string;
  role: Role.PASSENGER | Role.DRIVER;
}

export interface AuthResponse {
  accessToken: string;
  user: User;
}
