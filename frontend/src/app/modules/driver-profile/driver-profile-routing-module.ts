import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { DriverProfile } from './driver-profile/driver-profile';

const routes: Routes = [
  { path: '', component: DriverProfile, title: 'Driver registration | SafariFlow' },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class DriverProfileRoutingModule {}
