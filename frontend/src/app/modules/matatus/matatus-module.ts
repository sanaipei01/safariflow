import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { MatatuForm } from './matatu-form/matatu-form';
import { MatatuList } from './matatu-list/matatu-list';
import { MatatusRoutingModule } from './matatus-routing-module';

@NgModule({
  declarations: [MatatuList, MatatuForm],
  imports: [CommonModule, ReactiveFormsModule, MatatusRoutingModule],
})
export class MatatusModule {}
