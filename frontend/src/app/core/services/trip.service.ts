import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { RouteOption, Trip } from '../models/trip.model';

@Injectable({ providedIn: 'root' })
export class TripService {
  private readonly http = inject(HttpClient);
  private readonly url = `${environment.apiUrl}/trips`;

  routes(): Observable<RouteOption[]> {
    return this.http.get<RouteOption[]>(`${this.url}/routes`);
  }

  /** The running trip, or null when the driver has none. */
  current(): Observable<Trip | null> {
    return this.http.get<Trip | null>(`${this.url}/current`);
  }

  start(routeId: number): Observable<Trip> {
    return this.http.post<Trip>(this.url, { routeId });
  }

  end(): Observable<Trip> {
    return this.http.patch<Trip>(`${this.url}/current/end`, {});
  }
}
