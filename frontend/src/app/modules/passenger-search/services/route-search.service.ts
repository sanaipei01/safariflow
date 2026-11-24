import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { RouteMatch, SearchQuery } from '../models/route-match.model';

@Injectable({ providedIn: 'root' })
export class RouteSearchService {
  private readonly http = inject(HttpClient);
  private readonly url = `${environment.apiUrl}/route-search`;

  stages(): Observable<string[]> {
    return this.http.get<string[]>(`${this.url}/stages`);
  }

  search({ from, to }: SearchQuery): Observable<RouteMatch[]> {
    return this.http.get<RouteMatch[]>(this.url, {
      params: new HttpParams({ fromObject: { from, to } }),
    });
  }
}
