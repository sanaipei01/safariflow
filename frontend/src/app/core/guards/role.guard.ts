import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Role } from '../models/user.model';
import { AuthService } from '../services/auth.service';

/** Allows the route only for the roles listed in the route's `data.roles`. */
export const roleGuard: CanActivateFn = (route) => {
  const auth = inject(AuthService);
  const allowedRoles = route.data['roles'] as Role[] | undefined;
  const user = auth.user();

  if (!allowedRoles?.length || (user && allowedRoles.includes(user.role))) {
    return true;
  }
  return inject(Router).createUrlTree([auth.homeUrl()]);
};
