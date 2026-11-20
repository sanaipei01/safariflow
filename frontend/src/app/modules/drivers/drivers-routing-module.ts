import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { DriverList } from './driver-list/driver-list';

const routes: Routes = [{ path: '', component: DriverList, title: 'Drivers | SafariFlow' }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class DriversRoutingModule {}
