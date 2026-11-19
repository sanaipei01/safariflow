import { Component, inject, input } from '@angular/core';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-user-bar',
  standalone: false,
  templateUrl: './user-bar.html',
  styleUrl: './user-bar.css',
})
export class UserBar {
  protected readonly auth = inject(AuthService);
  readonly area = input.required<string>();
}
