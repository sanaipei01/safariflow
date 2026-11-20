import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { RouteList } from './route-list/route-list';

const routes: Routes = [{ path: '', component: RouteList, title: 'Routes | SafariFlow' }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class RoutesRoutingModule {}
