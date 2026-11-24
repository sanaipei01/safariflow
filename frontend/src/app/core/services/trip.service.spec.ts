import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { environment } from '../../../environments/environment';
import { TripService } from './trip.service';

const TRIPS_URL = `${environment.apiUrl}/trips`;

describe('TripService', () => {
  let service: TripService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(TripService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('loads the routes and the running trip', () => {
    service.routes().subscribe();
    expect(http.expectOne(`${TRIPS_URL}/routes`).request.method).toBe('GET');

    service.current().subscribe();
    expect(http.expectOne(`${TRIPS_URL}/current`).request.method).toBe('GET');
  });

  it('starts a trip on a route and ends it', () => {
    service.start(3).subscribe();
    const start = http.expectOne(TRIPS_URL);
    expect(start.request.method).toBe('POST');
    expect(start.request.body).toEqual({ routeId: 3 });

    service.end().subscribe();
    expect(http.expectOne(`${TRIPS_URL}/current/end`).request.method).toBe('PATCH');
  });
});
