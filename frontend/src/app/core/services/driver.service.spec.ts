import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { environment } from '../../../environments/environment';
import { DriverRegistration } from '../models/driver.model';
import { DriverService } from './driver.service';

const DRIVERS_URL = `${environment.apiUrl}/drivers`;

const registration: DriverRegistration = {
  nationalId: '12345678',
  phone: '0712345678',
  licenseNumber: 'DL-1001',
  licenseExpiry: '2030-12-31',
  psvBadgeNumber: 'PSV-5521',
  vehiclePlate: 'KDA 123A',
  vehicleMake: 'Toyota',
  vehicleModel: 'HiAce',
  vehicleYear: 2019,
  vehicleCapacity: 14,
  insurancePolicyNumber: 'POL-778',
  insuranceExpiry: '2030-06-30',
};

describe('DriverService', () => {
  let service: DriverService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(DriverService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('lets a driver register, read and correct their own registration', () => {
    service.register(registration).subscribe();
    const register = http.expectOne(DRIVERS_URL);
    expect(register.request.method).toBe('POST');
    expect(register.request.body).toEqual(registration);
    register.flush({});

    service.getMine().subscribe();
    expect(http.expectOne(`${DRIVERS_URL}/me`).request.method).toBe('GET');

    service.updateMine({ ...registration, licenseNumber: 'DL-2002' }).subscribe();
    const update = http.expectOne(`${DRIVERS_URL}/me`);
    expect(update.request.method).toBe('PATCH');
    expect(update.request.body).toEqual({ ...registration, licenseNumber: 'DL-2002' });
  });

  it('lists drivers, optionally by status', () => {
    service.list().subscribe();
    http.expectOne(DRIVERS_URL).flush([]);

    service.list('pending').subscribe();
    http.expectOne(`${DRIVERS_URL}?status=pending`).flush([]);
  });

  it('approves and rejects with PATCH requests', () => {
    service.approve(4).subscribe();
    expect(http.expectOne(`${DRIVERS_URL}/4/approve`).request.method).toBe('PATCH');

    service.reject(4, 'Blurry photo').subscribe();
    const reject = http.expectOne(`${DRIVERS_URL}/4/reject`);
    expect(reject.request.body).toEqual({ reason: 'Blurry photo' });
  });

  it('keeps count of the registrations waiting for review', () => {
    service.refreshPendingCount();
    http.expectOne(`${DRIVERS_URL}?status=pending`).flush([{}, {}]);
    expect(service.pendingCount()).toBe(2);

    service.refreshPendingCount();
    http
      .expectOne(`${DRIVERS_URL}?status=pending`)
      .flush(null, { status: 500, statusText: 'Server Error' });
    expect(service.pendingCount()).toBe(0);
  });
});
