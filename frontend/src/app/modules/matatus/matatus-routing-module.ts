import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { MatatuForm } from './matatu-form/matatu-form';
import { MatatuList } from './matatu-list/matatu-list';

const routes: Routes = [
  { path: '', component: MatatuList, title: 'Matatus | SafariFlow' },
  { path: 'new', component: MatatuForm, title: 'Add matatu | SafariFlow' },
  { path: ':id/edit', component: MatatuForm, title: 'Edit matatu | SafariFlow' },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class MatatusRoutingModule {}
