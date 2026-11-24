import { Component, inject } from '@angular/core';
import { IsActiveMatchOptions } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-passenger-layout',
  standalone: false,
  templateUrl: './passenger-layout.html',
  styleUrl: './passenger-layout.css',
})
export class PassengerLayout {
  protected readonly auth = inject(AuthService);

  // the Find Matatu tab stays lit when the address carries the chosen stages
  protected readonly activeOptions: IsActiveMatchOptions = {
    paths: 'exact',
    queryParams: 'ignored',
    matrixParams: 'ignored',
    fragment: 'ignored',
  };

  protected readonly tabs = [
    { label: 'Home', url: '/passenger', icon: 'pi-home' },
    { label: 'Find Matatu', url: '/passenger/find', icon: 'pi-search' },
    { label: 'Profile', url: '/passenger/profile', icon: 'pi-user' },
  ];
}
