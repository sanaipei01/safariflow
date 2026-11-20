import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { environment } from '../../../../environments/environment';
import { RouteService } from './route.service';

const ROUTES_URL = `${environment.apiUrl}/routes`;

describe('RouteService', () => {
  let service: RouteService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(RouteService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('lists routes', () => {
    service.list().subscribe();
    const list = http.expectOne(ROUTES_URL);
    expect(list.request.method).toBe('GET');
    list.flush([]);
  });

  it('creates and updates a route with its stages in order', () => {
    const body = { name: 'Nairobi - Thika', isActive: true, stages: ['Nairobi CBD', 'Thika'] };

    service.create(body).subscribe();
    const create = http.expectOne(ROUTES_URL);
    expect(create.request.method).toBe('POST');
    expect(create.request.body).toEqual(body);
    create.flush({});

    service.update(4, body).subscribe();
    const update = http.expectOne(`${ROUTES_URL}/4`);
    expect(update.request.method).toBe('PATCH');
    expect(update.request.body).toEqual(body);
  });

  it('deletes a route', () => {
    service.remove(4).subscribe();

    expect(http.expectOne(`${ROUTES_URL}/4`).request.method).toBe('DELETE');
  });
});
