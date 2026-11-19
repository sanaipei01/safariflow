import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Welcome } from './welcome';
import { WelcomeRoutingModule } from './welcome-routing-module';

@NgModule({
  declarations: [Welcome],
  imports: [CommonModule, WelcomeRoutingModule],
})
export class WelcomeModule {}
