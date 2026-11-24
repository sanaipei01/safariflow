import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { MessageModule } from 'primeng/message';
import { SelectModule } from 'primeng/select';
import { TagModule } from 'primeng/tag';
import { PassengerHome } from './passenger-home/passenger-home';
import { PassengerProfile } from './passenger-profile/passenger-profile';
import { PassengerSearchRoutingModule } from './passenger-search-routing-module';
import { RouteSearch } from './route-search/route-search';

@NgModule({
  declarations: [PassengerHome, PassengerProfile, RouteSearch],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ButtonModule,
    CardModule,
    MessageModule,
    SelectModule,
    TagModule,
    PassengerSearchRoutingModule,
  ],
})
export class PassengerSearchModule {}
