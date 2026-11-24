import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { Select } from 'primeng/select';
import { environment } from '../../../../environments/environment';
import { Driver } from '../../../core/models/driver.model';
import { buildDriver } from '../../../core/testing/driver.fixture';
import { DriversModule } from '../drivers-module';
import { DriverList } from './driver-list';

const DRIVERS_URL = `${environment.apiUrl}/drivers`;
const PENDING_URL = `${DRIVERS_URL}?status=pending`;
const SACCOS_URL = `${environment.apiUrl}/saccos`;

const superMetro = {
  id: 5,
  name: 'Super Metro',
  registrationNumber: 'SAC/001',
  phone: null,
};
const metroTrans = { id: 6, name: 'Metro Trans', registrationNumber: 'SAC/002', phone: null };

describe('DriverList', () => {
  let fixture: ComponentFixture<DriverList>;
  let page: HTMLElement;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [DriversModule],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    });
    http = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(DriverList);
    page = fixture.nativeElement as HTMLElement;
  });

  afterEach(() => http.verify());

  async function render(drivers: Driver[]): Promise<void> {
    fixture.detectChanges();
    http.expectOne(DRIVERS_URL).flush(drivers);
    await fixture.whenStable();
  }

  /** Pop-ups are drawn outside the component, so buttons are looked up in the whole page. */
  const button = (label: string) =>
    Array.from(document.body.querySelectorAll('button')).find(
      (item) => item.textContent?.trim() === label,
    )!;

  /** A pending registration loads the Saccos for the pop-up, so they are answered here. */
  async function openReview(label = 'Review', saccos: object[] = [superMetro]): Promise<void> {
    button(label).click();
    if (label === 'Review') {
      http.expectOne(SACCOS_URL).flush(saccos);
    }
    await fixture.whenStable();
  }

  it('shows each driver with their vehicle, Sacco and status', async () => {
    await render([buildDriver(), buildDriver({ id: 2, saccoName: null })]);

    expect(page.textContent).toContain('Demo Driver');
    expect(page.textContent).toContain('KDA 123A');
    expect(page.textContent).toContain('Toyota HiAce');
    expect(page.textContent).toContain('Super Metro');
    expect(page.textContent).toContain('No Sacco');
    expect(page.querySelector('.p-tag')?.textContent).toContain('Pending');
  });

  it('tells the user when there are no drivers', async () => {
    await render([]);

    expect(page.textContent).toContain('No drivers found.');
  });

  it('does not offer to assign a Sacco or a matatu', async () => {
    await render([buildDriver({ status: 'approved' })]);

    expect(page.textContent).not.toContain('Assign');
    expect(fixture.debugElement.queryAll(By.directive(Select))).toHaveLength(1);
  });

  it('filters by status', async () => {
    await render([buildDriver()]);

    const filter = fixture.debugElement.query(By.directive(Select));
    filter.triggerEventHandler('onChange', { value: 'pending' });

    http.expectOne(`${DRIVERS_URL}?status=pending`).flush([]);
  });

  it('shows everything the driver submitted in the review pop-up', async () => {
    await render([buildDriver()]);

    await openReview();

    const popup = document.body.textContent;
    expect(popup).toContain('12345678');
    expect(popup).toContain('DL-1001');
    expect(popup).toContain('PSV-5521');
    expect(popup).toContain('POL-778');
    expect(popup).toContain('SAC/001');
  });

  it('approves a pending registration and reloads the list', async () => {
    await render([buildDriver()]);
    await openReview();

    button('Approve').click();
    const approve = http.expectOne(`${DRIVERS_URL}/1/approve`);
    expect(approve.request.method).toBe('PATCH');
    expect(approve.request.body).toEqual({ saccoId: 5 });
    approve.flush(buildDriver({ status: 'approved' }));

    http.expectOne(DRIVERS_URL).flush([buildDriver({ status: 'approved' })]);
    http.expectOne(PENDING_URL).flush([]);
    await fixture.whenStable();
    expect(page.querySelector('.p-tag')?.textContent).toContain('Approved');
  });

  it('picks the Sacco the driver named and asks for one when none matches', async () => {
    await render([buildDriver({ saccoName: 'Unknown Sacco', saccoRegistrationNumber: null })]);
    await openReview('Review', [superMetro, metroTrans]);

    expect(button('Approve').disabled).toBe(true);
    button('Approve').click();
    http.expectNone(`${DRIVERS_URL}/1/approve`);

    const select = fixture.debugElement.queryAll(By.directive(Select))[1];
    select.triggerEventHandler('ngModelChange', 6);
    await fixture.whenStable();
    button('Approve').click();

    const approve = http.expectOne(`${DRIVERS_URL}/1/approve`);
    expect(approve.request.body).toEqual({ saccoId: 6 });
    approve.flush(buildDriver({ status: 'approved' }));
    http.expectOne(DRIVERS_URL).flush([]);
    http.expectOne(PENDING_URL).flush([]);
  });

  it('asks for a reason before rejecting and sends it', async () => {
    await render([buildDriver()]);
    await openReview();

    button('Reject').click();
    await fixture.whenStable();
    button('Reject driver').click();
    await fixture.whenStable();
    http.expectNone(`${DRIVERS_URL}/1/reject`);
    expect(document.body.querySelector('p-message')).not.toBeNull();

    const reason = document.body.querySelector<HTMLInputElement>('#reject-reason')!;
    reason.value = '  Insurance has expired ';
    reason.dispatchEvent(new Event('input'));
    button('Reject driver').click();

    const reject = http.expectOne(`${DRIVERS_URL}/1/reject`);
    expect(reject.request.body).toEqual({ reason: 'Insurance has expired' });
    reject.flush(buildDriver({ status: 'rejected' }));
    http.expectOne(DRIVERS_URL).flush([]);
    http.expectOne(PENDING_URL).flush([]);
  });

  it('only lets the operator view a registration that is already decided', async () => {
    await render([buildDriver({ status: 'approved' })]);

    await openReview('View');

    expect(button('Approve')).toBeUndefined();
    expect(button('Close')).toBeDefined();
  });

  it('shows an error when the decision fails', async () => {
    await render([buildDriver()]);
    await openReview();

    button('Approve').click();
    http
      .expectOne(`${DRIVERS_URL}/1/approve`)
      .flush(
        { message: 'This driver is already approved' },
        { status: 409, statusText: 'Conflict' },
      );
    http.expectOne(DRIVERS_URL).flush([]);
    http.expectOne(PENDING_URL).flush([]);
    await fixture.whenStable();

    expect(page.textContent).toContain('This driver is already approved');
  });
});
