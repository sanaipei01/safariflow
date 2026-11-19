import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Sacco } from '../models/sacco.model';

@Injectable({ providedIn: 'root' })
export class SaccoService {
  private readonly http = inject(HttpClient);

  list(): Observable<Sacco[]> {
    return this.http.get<Sacco[]>(`${environment.apiUrl}/saccos`);
  }
}
