import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { environment } from '../../../../environments/environment';
import { RouteSearchService } from './route-search.service';

describe('RouteSearchService', () => {
  let service: RouteSearchService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(RouteSearchService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('loads the stages', () => {
    service.stages().subscribe();

    http.expectOne(`${environment.apiUrl}/route-search/stages`).flush([]);
  });

  it('searches from one stage to another', () => {
    service.search({ from: 'CBD', to: 'Thika' }).subscribe();

    const request = http.expectOne(`${environment.apiUrl}/route-search?from=CBD&to=Thika`);
    expect(request.request.method).toBe('GET');
    request.flush([]);
  });
});
