import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UserBar } from './user-bar/user-bar';

@NgModule({
  declarations: [UserBar],
  imports: [CommonModule],
  exports: [UserBar],
})
export class SharedModule {}
