import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { environment } from '../../../../environments/environment';
import { MatatuService } from './matatu.service';

const MATATUS_URL = `${environment.apiUrl}/matatus`;

describe('MatatuService', () => {
  let service: MatatuService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(MatatuService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('lists all matatus when there are no filters', () => {
    service.list().subscribe();

    const request = http.expectOne(MATATUS_URL);
    expect(request.request.method).toBe('GET');
    request.flush([]);
  });

  it('sends the SACCO and status filters as query parameters', () => {
    service.list({ saccoId: 2, status: 'maintenance' }).subscribe();

    http.expectOne(`${MATATUS_URL}?saccoId=2&status=maintenance`).flush([]);
  });

  it('creates, updates and deletes a matatu', () => {
    const body = { plateNumber: 'KDA 123A', capacity: 33, status: 'active' as const, saccoId: 1 };

    service.create(body).subscribe();
    const create = http.expectOne(MATATUS_URL);
    expect(create.request.method).toBe('POST');
    expect(create.request.body).toEqual(body);
    create.flush({});

    service.update(3, body).subscribe();
    expect(http.expectOne(`${MATATUS_URL}/3`).request.method).toBe('PATCH');

    service.remove(3).subscribe();
    expect(http.expectOne(`${MATATUS_URL}/3`).request.method).toBe('DELETE');
  });
});
