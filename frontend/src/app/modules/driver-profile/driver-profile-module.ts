import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { DatePickerModule } from 'primeng/datepicker';
import { DialogModule } from 'primeng/dialog';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { SharedModule } from '../../shared/shared-module';
import { DriverProfile } from './driver-profile/driver-profile';
import { DriverProfileRoutingModule } from './driver-profile-routing-module';
import { DriverRegistrationDialog } from './driver-registration-dialog/driver-registration-dialog';

@NgModule({
  declarations: [DriverProfile, DriverRegistrationDialog],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ButtonModule,
    CardModule,
    DatePickerModule,
    DialogModule,
    InputNumberModule,
    InputTextModule,
    MessageModule,
    TagModule,
    ToastModule,
    SharedModule,
    DriverProfileRoutingModule,
  ],
})
export class DriverProfileModule {}
