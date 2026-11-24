import { Component, OnInit, inject, signal } from '@angular/core';
import { FormControl } from '@angular/forms';
import { Observable, finalize, forkJoin } from 'rxjs';
import { RouteOption, Trip } from '../../../core/models/trip.model';
import { TripService } from '../../../core/services/trip.service';
import { getErrorMessage } from '../../../core/utils/http-error';

@Component({
  selector: 'app-driver-trip',
  standalone: false,
  templateUrl: './driver-trip.html',
  styleUrl: './driver-trip.css',
})
export class DriverTrip implements OnInit {
  private readonly tripService = inject(TripService);

  readonly routeControl = new FormControl<number | null>(null);
  protected readonly trip = signal<Trip | null>(null);
  protected readonly routes = signal<RouteOption[]>([]);
  protected readonly loading = signal(true);
  protected readonly busy = signal(false);
  protected readonly errorMessage = signal<string | null>(null);

  ngOnInit(): void {
    forkJoin({ trip: this.tripService.current(), routes: this.tripService.routes() })
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: ({ trip, routes }) => {
          this.trip.set(trip);
          this.routes.set(routes);
        },
        error: (error: unknown) => this.errorMessage.set(getErrorMessage(error)),
      });
  }

  protected start(): void {
    const routeId = this.routeControl.value;
    if (routeId === null) {
      this.errorMessage.set('Choose a route first.');
      return;
    }
    this.run(this.tripService.start(routeId), (trip) => this.trip.set(trip));
  }

  protected end(): void {
    this.run(this.tripService.end(), () => {
      this.trip.set(null);
      this.routeControl.reset();
    });
  }

  private run<T>(request: Observable<T>, onDone: (result: T) => void): void {
    this.busy.set(true);
    this.errorMessage.set(null);
    request.pipe(finalize(() => this.busy.set(false))).subscribe({
      next: onDone,
      error: (error: unknown) => this.errorMessage.set(getErrorMessage(error)),
    });
  }
}
