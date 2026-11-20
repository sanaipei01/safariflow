import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Driver, DriverRegistration, DriverStatus } from '../models/driver.model';

@Injectable({ providedIn: 'root' })
export class DriverService {
  private readonly http = inject(HttpClient);
  private readonly url = `${environment.apiUrl}/drivers`;

  /** How many registrations are waiting for review. The admin menu shows it next to Drivers. */
  readonly pendingCount = signal(0);

  // Used by the signed-in driver.

  getMine(): Observable<Driver> {
    return this.http.get<Driver>(`${this.url}/me`);
  }

  register(registration: DriverRegistration): Observable<Driver> {
    return this.http.post<Driver>(this.url, registration);
  }

  updateMine(registration: DriverRegistration): Observable<Driver> {
    return this.http.patch<Driver>(`${this.url}/me`, registration);
  }

  // Used by admins and operators.

  list(status?: DriverStatus): Observable<Driver[]> {
    const params = status ? new HttpParams().set('status', status) : new HttpParams();
    return this.http.get<Driver[]>(this.url, { params });
  }

  approve(id: number): Observable<Driver> {
    return this.http.patch<Driver>(`${this.url}/${id}/approve`, {});
  }

  reject(id: number, reason: string): Observable<Driver> {
    return this.http.patch<Driver>(`${this.url}/${id}/reject`, { reason });
  }

  refreshPendingCount(): void {
    this.list('pending').subscribe({
      next: (drivers) => this.pendingCount.set(drivers.length),
      error: () => this.pendingCount.set(0),
    });
  }
}
