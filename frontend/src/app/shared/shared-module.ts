import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { DriverDetails } from './driver-details/driver-details';
import { UserBar } from './user-bar/user-bar';

@NgModule({
  declarations: [UserBar, DriverDetails],
  imports: [CommonModule, ButtonModule],
  exports: [UserBar, DriverDetails],
})
export class SharedModule {}
