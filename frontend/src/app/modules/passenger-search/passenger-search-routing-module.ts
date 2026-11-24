import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { PassengerHome } from './passenger-home/passenger-home';
import { PassengerProfile } from './passenger-profile/passenger-profile';
import { RouteSearch } from './route-search/route-search';

const routes: Routes = [
  { path: '', component: PassengerHome, title: 'Home | SafariFlow' },
  { path: 'find', component: RouteSearch, title: 'Find a matatu | SafariFlow' },
  { path: 'profile', component: PassengerProfile, title: 'Profile | SafariFlow' },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class PassengerSearchRoutingModule {}
