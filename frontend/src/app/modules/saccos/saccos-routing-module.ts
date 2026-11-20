import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { SaccoList } from './sacco-list/sacco-list';

const routes: Routes = [{ path: '', component: SaccoList, title: 'Saccos | SafariFlow' }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class SaccosRoutingModule {}
