import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';
import { TableModule } from 'primeng/table';
import { SaccoList } from './sacco-list/sacco-list';
import { SaccosRoutingModule } from './saccos-routing-module';

@NgModule({
  declarations: [SaccoList],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ButtonModule,
    ConfirmDialogModule,
    DialogModule,
    InputTextModule,
    MessageModule,
    TableModule,
    SaccosRoutingModule,
  ],
})
export class SaccosModule {}
