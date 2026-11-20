import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { Matatu, MatatuFilters, SaveMatatuRequest } from '../models/matatu.model';

@Injectable({ providedIn: 'root' })
export class MatatuService {
  private readonly http = inject(HttpClient);
  private readonly url = `${environment.apiUrl}/matatus`;

  list(filters: MatatuFilters = {}): Observable<Matatu[]> {
    let params = new HttpParams();
    if (filters.saccoId) {
      params = params.set('saccoId', filters.saccoId);
    }
    if (filters.status) {
      params = params.set('status', filters.status);
    }
    return this.http.get<Matatu[]>(this.url, { params });
  }

  get(id: number): Observable<Matatu> {
    return this.http.get<Matatu>(`${this.url}/${id}`);
  }

  create(request: SaveMatatuRequest): Observable<Matatu> {
    return this.http.post<Matatu>(this.url, request);
  }

  update(id: number, request: SaveMatatuRequest): Observable<Matatu> {
    return this.http.patch<Matatu>(`${this.url}/${id}`, request);
  }

  remove(id: number): Observable<void> {
    return this.http.delete<void>(`${this.url}/${id}`);
  }
}
