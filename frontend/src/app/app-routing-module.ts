import { inject, NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { authGuard, guestGuard } from './core/guards/auth.guard';
import { roleGuard } from './core/guards/role.guard';
import { Role } from './core/models/user.model';
import { AuthService } from './core/services/auth.service';
import { AdminLayout } from './layouts/admin-layout/admin-layout';
import { AuthLayout } from './layouts/auth-layout/auth-layout';
import { DriverLayout } from './layouts/driver-layout/driver-layout';
import { PassengerLayout } from './layouts/passenger-layout/passenger-layout';

const roles = (...allowed: Role[]) => ({ roles: allowed });

/** Signed-in users start on their own home page, everyone else on the welcome page. */
const redirectToStart = () => {
  const auth = inject(AuthService);
  return auth.isLoggedIn() ? auth.homeUrl() : '/welcome';
};

const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: redirectToStart },
  {
    path: 'welcome',
    canActivate: [guestGuard],
    loadChildren: () => import('./modules/welcome/welcome-module').then((m) => m.WelcomeModule),
  },
  {
    path: 'auth',
    component: AuthLayout,
    canActivate: [guestGuard],
    children: [
      {
        path: '',
        loadChildren: () => import('./modules/auth/auth-module').then((m) => m.AuthModule),
      },
    ],
  },
  {
    path: 'admin',
    component: AdminLayout,
    canActivate: [authGuard, roleGuard],
    data: roles(Role.ADMIN, Role.OPERATOR),
  },
  {
    path: 'driver',
    component: DriverLayout,
    canActivate: [authGuard, roleGuard],
    data: roles(Role.DRIVER),
  },
  {
    path: 'passenger',
    component: PassengerLayout,
    canActivate: [authGuard, roleGuard],
    data: roles(Role.PASSENGER),
  },
  { path: '**', redirectTo: '' },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
