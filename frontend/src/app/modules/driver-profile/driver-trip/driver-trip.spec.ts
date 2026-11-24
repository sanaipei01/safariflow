import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { environment } from '../../../../environments/environment';
import { Trip } from '../../../core/models/trip.model';
import { DriverProfileModule } from '../driver-profile-module';
import { DriverTrip } from './driver-trip';

const TRIPS_URL = `${environment.apiUrl}/trips`;

const running: Trip = {
  id: 1,
  routeId: 1,
  routeName: 'Thika Road',
  status: 'active',
  startedAt: '2026-11-24T09:00:00Z',
  endedAt: null,
};

describe('DriverTrip', () => {
  let fixture: ComponentFixture<DriverTrip>;
  let page: HTMLElement;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [DriverProfileModule],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    http = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(DriverTrip);
    page = fixture.nativeElement as HTMLElement;
    fixture.detectChanges();
  });

  afterEach(() => http.verify());

  async function load(trip: Trip | null): Promise<void> {
    http.expectOne(`${TRIPS_URL}/current`).flush(trip);
    http.expectOne(`${TRIPS_URL}/routes`).flush([{ id: 1, name: 'Thika Road' }]);
    await fixture.whenStable();
  }

  const button = (label: string) =>
    Array.from(page.querySelectorAll('button')).find(
      (item) => item.textContent?.trim() === label,
    ) as HTMLButtonElement;

  it('starts a trip on the chosen route', async () => {
    await load(null);
    fixture.componentInstance.routeControl.setValue(1);

    button('Start trip').click();
    const start = http.expectOne(TRIPS_URL);
    expect(start.request.body).toEqual({ routeId: 1 });
    start.flush(running);
    await fixture.whenStable();

    expect(page.textContent).toContain('In progress');
    expect(page.textContent).toContain('Thika Road');
    expect(button('End trip')).toBeTruthy();
  });

  it('asks for a route before starting', async () => {
    await load(null);

    button('Start trip').click();
    await fixture.whenStable();

    http.expectNone(TRIPS_URL);
    expect(page.querySelector('[role=alert]')?.textContent).toContain('Choose a route first');
  });

  it('shows a trip that is already running and ends it', async () => {
    await load(running);
    expect(page.textContent).toContain('Thika Road');

    button('End trip').click();
    const end = http.expectOne(`${TRIPS_URL}/current/end`);
    expect(end.request.method).toBe('PATCH');
    end.flush({ ...running, status: 'completed' });
    await fixture.whenStable();

    expect(button('Start trip')).toBeTruthy();
    expect(page.textContent).not.toContain('In progress');
  });

  it('shows the server message when a trip cannot be started', async () => {
    await load(null);
    fixture.componentInstance.routeControl.setValue(1);

    button('Start trip').click();
    http
      .expectOne(TRIPS_URL)
      .flush(
        { message: 'You already have a trip in progress. End it first' },
        { status: 409, statusText: 'Conflict' },
      );
    await fixture.whenStable();

    expect(page.querySelector('[role=alert]')?.textContent).toContain('already have a trip');
  });
});
