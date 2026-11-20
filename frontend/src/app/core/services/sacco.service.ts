import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Sacco, SaccoInput } from '../models/sacco.model';

@Injectable({ providedIn: 'root' })
export class SaccoService {
  private readonly http = inject(HttpClient);
  private readonly url = `${environment.apiUrl}/saccos`;

  list(): Observable<Sacco[]> {
    return this.http.get<Sacco[]>(this.url);
  }

  create(sacco: SaccoInput): Observable<Sacco> {
    return this.http.post<Sacco>(this.url, sacco);
  }

  update(id: number, sacco: SaccoInput): Observable<Sacco> {
    return this.http.patch<Sacco>(`${this.url}/${id}`, sacco);
  }

  remove(id: number): Observable<void> {
    return this.http.delete<void>(`${this.url}/${id}`);
  }
}
