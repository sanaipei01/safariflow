import { Component, inject } from '@angular/core';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-passenger-profile',
  standalone: false,
  templateUrl: './passenger-profile.html',
  styleUrl: './passenger-profile.css',
})
export class PassengerProfile {
  protected readonly auth = inject(AuthService);
}
