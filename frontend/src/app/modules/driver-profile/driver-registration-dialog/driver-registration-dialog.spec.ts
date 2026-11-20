import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MessageService } from 'primeng/api';
import { environment } from '../../../../environments/environment';
import { Driver } from '../../../core/models/driver.model';
import { buildDriver } from '../../../core/testing/driver.fixture';
import { DriverProfileModule } from '../driver-profile-module';
import { DriverRegistrationDialog } from './driver-registration-dialog';

const DRIVERS_URL = `${environment.apiUrl}/drivers`;

const filledForm = {
  nationalId: '12345678',
  phone: '0712345678',
  licenseNumber: ' DL-1001 ',
  licenseExpiry: new Date(2030, 11, 31),
  psvBadgeNumber: 'PSV-5521',
  vehiclePlate: 'kda123a',
  vehicleMake: 'Toyota',
  vehicleModel: 'HiAce',
  vehicleYear: 2019,
  vehicleCapacity: 14,
  insurancePolicyNumber: 'POL-778',
  insuranceExpiry: new Date(2030, 5, 30),
};

describe('DriverRegistrationDialog', () => {
  let fixture: ComponentFixture<DriverRegistrationDialog>;
  let dialog: DriverRegistrationDialog;
  let http: HttpTestingController;
  let saved: Driver[];

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [DriverProfileModule],
      providers: [provideHttpClient(), provideHttpClientTesting(), MessageService],
    });
    http = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(DriverRegistrationDialog);
    dialog = fixture.componentInstance;
    saved = [];
    dialog.saved.subscribe((driver) => saved.push(driver));
  });

  afterEach(() => http.verify());

  async function open(driver: Driver | null = null): Promise<void> {
    fixture.componentRef.setInput('driver', driver);
    fixture.componentRef.setInput('visible', true);
    fixture.detectChanges();
    await fixture.whenStable();
  }

  const text = () => document.body.textContent ?? '';
  const submit = async () => {
    const button = Array.from(document.body.querySelectorAll('button')).find((item) =>
      /registration$/.test(item.textContent?.trim() ?? ''),
    )!;
    button.click();
    await fixture.whenStable();
  };

  it('is organised into sections and marks the required fields', async () => {
    await open();

    for (const heading of ['Personal details', 'Driving licence', 'Vehicle', 'Sacco (optional)']) {
      expect(text()).toContain(heading);
    }
    expect(document.body.querySelectorAll('.required').length).toBeGreaterThan(10);
  });

  it('does not send an empty form and explains what is missing', async () => {
    await open();

    await submit();

    http.expectNone(DRIVERS_URL);
    expect(document.body.querySelectorAll('p-message').length).toBeGreaterThan(10);
  });

  it('registers the driver with their vehicle and tidied-up details', async () => {
    await open();
    dialog.form.patchValue(filledForm);

    await submit();

    const request = http.expectOne(DRIVERS_URL);
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({
      nationalId: '12345678',
      phone: '0712345678',
      licenseNumber: 'DL-1001',
      licenseExpiry: '2030-12-31',
      psvBadgeNumber: 'PSV-5521',
      vehiclePlate: 'kda123a',
      vehicleMake: 'Toyota',
      vehicleModel: 'HiAce',
      vehicleYear: 2019,
      vehicleCapacity: 14,
      insurancePolicyNumber: 'POL-778',
      insuranceExpiry: '2030-06-30',
    });
    request.flush(buildDriver());
    await fixture.whenStable();

    expect(saved).toHaveLength(1);
    expect(dialog.visible()).toBe(false);
  });

  it('sends the Sacco only when the driver wrote one', async () => {
    await open();
    dialog.form.patchValue({ ...filledForm, saccoName: ' Super Metro ', saccoPhone: '0722000000' });

    await submit();

    const request = http.expectOne(DRIVERS_URL);
    expect(request.request.body).toMatchObject({
      saccoName: 'Super Metro',
      saccoPhone: '0722000000',
    });
    request.flush(buildDriver());
  });

  it('needs a Sacco name when other Sacco details are given', async () => {
    await open();
    dialog.form.patchValue({ ...filledForm, saccoRegistrationNumber: 'SAC/001' });

    await submit();

    http.expectNone(DRIVERS_URL);
    expect(text()).toContain('Enter the Sacco name');
  });

  it.each([
    ['nationalId', '123'],
    ['phone', '12345'],
    ['vehiclePlate', 'ABC'],
    ['vehicleYear', 1980],
    ['vehicleCapacity', 80],
  ])('does not accept an invalid %s', async (field, value) => {
    await open();
    dialog.form.patchValue({ ...filledForm, [field]: value });

    await submit();

    http.expectNone(DRIVERS_URL);
  });

  it('keeps the pop-up open and shows the reason when the server refuses', async () => {
    await open();
    dialog.form.patchValue(filledForm);

    await submit();
    http
      .expectOne(DRIVERS_URL)
      .flush(
        { message: 'This licence number is already registered' },
        { status: 409, statusText: 'Conflict' },
      );
    await fixture.whenStable();

    expect(dialog.visible()).toBe(true);
    expect(text()).toContain('This licence number is already registered');
    expect(saved).toHaveLength(0);
  });

  it('fills in the earlier details when a rejected driver corrects them', async () => {
    await open(buildDriver({ status: 'rejected', rejectionReason: 'Wrong plate' }));

    expect(dialog.form.getRawValue()).toMatchObject({
      licenseNumber: 'DL-1001',
      vehiclePlate: 'KDA 123A',
      saccoName: 'Super Metro',
    });

    await submit();

    const request = http.expectOne(`${DRIVERS_URL}/me`);
    expect(request.request.method).toBe('PATCH');
    expect(request.request.body).toMatchObject({ licenseExpiry: '2030-12-31' });
    request.flush(buildDriver());
  });
});
