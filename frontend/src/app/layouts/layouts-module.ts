import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { SharedModule } from '../shared/shared-module';
import { AdminLayout } from './admin-layout/admin-layout';
import { AuthLayout } from './auth-layout/auth-layout';
import { DriverLayout } from './driver-layout/driver-layout';
import { PassengerLayout } from './passenger-layout/passenger-layout';

@NgModule({
  declarations: [AuthLayout, AdminLayout, DriverLayout, PassengerLayout],
  imports: [CommonModule, RouterModule, SharedModule],
})
export class LayoutsModule {}
