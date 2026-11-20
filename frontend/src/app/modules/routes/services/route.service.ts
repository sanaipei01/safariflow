import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { MatatuRoute, SaveRouteRequest } from '../models/matatu-route.model';

@Injectable({ providedIn: 'root' })
export class RouteService {
  private readonly http = inject(HttpClient);
  private readonly url = `${environment.apiUrl}/routes`;

  list(): Observable<MatatuRoute[]> {
    return this.http.get<MatatuRoute[]>(this.url);
  }

  create(request: SaveRouteRequest): Observable<MatatuRoute> {
    return this.http.post<MatatuRoute>(this.url, request);
  }

  update(id: number, request: SaveRouteRequest): Observable<MatatuRoute> {
    return this.http.patch<MatatuRoute>(`${this.url}/${id}`, request);
  }

  remove(id: number): Observable<void> {
    return this.http.delete<void>(`${this.url}/${id}`);
  }
}
