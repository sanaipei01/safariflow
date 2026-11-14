import { Role } from '../enums/role.enum';

export interface JwtPayload {
  sub: number;
  role: Role;
}
