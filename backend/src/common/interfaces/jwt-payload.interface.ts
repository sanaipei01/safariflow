import { Role } from '../enums/role.enum';

export interface JwtPayload {
  sub: number;
  role: Role;
  /** id of this login, so the server can end it */
  sid: string;
}
