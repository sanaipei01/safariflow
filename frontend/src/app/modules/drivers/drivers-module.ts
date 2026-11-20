import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';
import { SelectModule } from 'primeng/select';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { SharedModule } from '../../shared/shared-module';
import { DriverList } from './driver-list/driver-list';
import { DriversRoutingModule } from './drivers-routing-module';

@NgModule({
  declarations: [DriverList],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    ButtonModule,
    DialogModule,
    InputTextModule,
    MessageModule,
    SelectModule,
    TableModule,
    TagModule,
    SharedModule,
    DriversRoutingModule,
  ],
})
export class DriversModule {}
