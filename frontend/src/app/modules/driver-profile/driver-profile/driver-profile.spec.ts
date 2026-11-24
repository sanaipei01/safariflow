import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MessageService } from 'primeng/api';
import { environment } from '../../../../environments/environment';
import { Driver } from '../../../core/models/driver.model';
import { buildDriver } from '../../../core/testing/driver.fixture';
import { DriverProfileModule } from '../driver-profile-module';
import { DriverProfile } from './driver-profile';

const ME_URL = `${environment.apiUrl}/drivers/me`;
const TRIPS_URL = `${environment.apiUrl}/trips`;

describe('DriverProfile', () => {
  let fixture: ComponentFixture<DriverProfile>;
  let page: HTMLElement;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [DriverProfileModule],
      providers: [provideHttpClient(), provideHttpClientTesting(), MessageService],
    });
    http = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(DriverProfile);
    page = fixture.nativeElement as HTMLElement;
    fixture.detectChanges();
  });

  afterEach(() => http.verify());

  async function loadProfile(driver: Driver | null): Promise<void> {
    const request = http.expectOne(ME_URL);
    if (driver) {
      request.flush(driver);
    } else {
      request.flush({ message: 'Not registered' }, { status: 404, statusText: 'Not Found' });
    }
    await fixture.whenStable();
  }

  const popup = () => document.body.querySelector('#driver-registration-form');

  it('opens the registration pop-up for a driver who has not registered', async () => {
    await loadProfile(null);

    expect(popup()).not.toBeNull();
    expect(page.textContent).toContain('Complete your registration');
  });

  it('lets a driver who closed the pop-up open it again', async () => {
    await loadProfile(null);
    const cancel = Array.from(document.body.querySelectorAll('button')).find(
      (item) => item.textContent?.trim() === 'Cancel',
    )!;
    cancel.click();
    await fixture.whenStable();

    (page.querySelector('button') as HTMLButtonElement).click();
    await fixture.whenStable();

    expect(popup()).not.toBeNull();
  });

  it('shows a pending registration with what was submitted', async () => {
    await loadProfile(buildDriver());

    expect(page.textContent).toContain('waiting for review');
    expect(page.textContent).toContain('KDA 123A');
    expect(popup()).toBeNull();
  });

  it('tells an approved driver they are approved and lets them start a trip', async () => {
    await loadProfile(buildDriver({ status: 'approved' }));
    http.expectOne(`${TRIPS_URL}/current`).flush(null);
    http.expectOne(`${TRIPS_URL}/routes`).flush([{ id: 1, name: 'Thika Road' }]);
    await fixture.whenStable();

    expect(page.querySelector('.p-tag')?.textContent).toContain('Approved');
    expect(page.textContent).not.toContain('Update and resubmit');
    expect(page.textContent).toContain('Start trip');
  });

  it('does not offer trips until the driver is approved', async () => {
    await loadProfile(buildDriver());

    expect(page.querySelector('app-driver-trip')).toBeNull();
  });

  it('shows why a registration was rejected and offers to correct it', async () => {
    await loadProfile(
      buildDriver({ status: 'rejected', rejectionReason: 'Insurance has expired' }),
    );

    expect(page.textContent).toContain('Insurance has expired');
    const resubmit = Array.from(page.querySelectorAll('button')).find(
      (item) => item.textContent?.trim() === 'Update and resubmit',
    )!;
    resubmit.click();
    await fixture.whenStable();

    expect(popup()).not.toBeNull();
  });

  it('shows an error instead of the pop-up when the server fails', async () => {
    http.expectOne(ME_URL).flush({ message: 'Boom' }, { status: 500, statusText: 'Server Error' });
    await fixture.whenStable();

    expect(page.querySelector('[role=alert]')?.textContent).toContain('Boom');
    expect(popup()).toBeNull();
  });
});
