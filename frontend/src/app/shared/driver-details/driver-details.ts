import { Component, input } from '@angular/core';
import { Driver } from '../../core/models/driver.model';

/** Everything a driver submitted, shown read-only. Used by the driver and by the operator. */
@Component({
  selector: 'app-driver-details',
  standalone: false,
  templateUrl: './driver-details.html',
})
export class DriverDetails {
  readonly driver = input.required<Driver>();
}
