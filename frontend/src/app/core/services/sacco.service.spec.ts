import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { environment } from '../../../environments/environment';
import { SaccoService } from './sacco.service';

const SACCOS_URL = `${environment.apiUrl}/saccos`;

describe('SaccoService', () => {
  let service: SaccoService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(SaccoService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('lists, adds, edits and deletes Saccos', () => {
    service.list().subscribe();
    expect(http.expectOne(SACCOS_URL).request.method).toBe('GET');

    service.create({ name: 'Super Metro', registrationNumber: 'SAC/001' }).subscribe();
    const create = http.expectOne(SACCOS_URL);
    expect(create.request.method).toBe('POST');
    expect(create.request.body).toEqual({ name: 'Super Metro', registrationNumber: 'SAC/001' });

    service.update(3, { name: 'Metro', registrationNumber: 'SAC/009' }).subscribe();
    const update = http.expectOne(`${SACCOS_URL}/3`);
    expect(update.request.method).toBe('PATCH');

    service.remove(3).subscribe();
    expect(http.expectOne(`${SACCOS_URL}/3`).request.method).toBe('DELETE');
  });
});
