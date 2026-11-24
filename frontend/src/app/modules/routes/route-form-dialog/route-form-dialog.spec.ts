import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { environment } from '../../../../environments/environment';
import { MatatuRoute } from '../models/matatu-route.model';
import { RoutesModule } from '../routes-module';
import { RouteFormDialog } from './route-form-dialog';

const ROUTES_URL = `${environment.apiUrl}/routes`;

const existing: MatatuRoute = {
  id: 5,
  name: 'Nairobi - Thika',
  routeNumber: '237',
  fare: 100,
  isActive: false,
  stages: [
    { id: 1, name: 'Nairobi CBD', sequence: 1 },
    { id: 2, name: 'Githurai', sequence: 2 },
    { id: 3, name: 'Thika', sequence: 3 },
  ],
};

describe('RouteFormDialog', () => {
  let fixture: ComponentFixture<RouteFormDialog>;
  let http: HttpTestingController;
  let saved: number;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [RoutesModule],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    http = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(RouteFormDialog);
    saved = 0;
    fixture.componentInstance.saved.subscribe(() => saved++);
  });

  afterEach(() => http.verify());

  async function open(route: MatatuRoute | null = null): Promise<void> {
    fixture.componentRef.setInput('route', route);
    fixture.componentRef.setInput('visible', true);
    fixture.detectChanges();
    await fixture.whenStable();
  }

  const body = document.body;
  const stageInputs = () => Array.from(body.querySelectorAll<HTMLInputElement>('.stage-row input'));
  const buttonByLabel = (label: string) =>
    body.querySelector<HTMLButtonElement>(`button[aria-label="${label}"]`)!;
  const textButton = (label: string) =>
    Array.from(body.querySelectorAll('button')).find((item) => item.textContent?.trim() === label)!;

  function type(input: HTMLInputElement, value: string): void {
    input.value = value;
    input.dispatchEvent(new Event('input'));
  }

  it('starts with an origin and a destination', async () => {
    await open();

    expect(stageInputs().map((input) => input.placeholder)).toEqual(['Origin', 'Destination']);
  });

  it('does not send anything while the form is invalid', async () => {
    await open();

    textButton('Save route').click();
    await fixture.whenStable();

    http.expectNone(ROUTES_URL);
    expect(body.querySelectorAll('p-message').length).toBeGreaterThan(0);
  });

  it('sends the stages in the order shown, after adding and moving one', async () => {
    await open();
    type(body.querySelector<HTMLInputElement>('#name')!, '  Nairobi - Thika ');
    type(stageInputs()[0], 'Nairobi CBD');
    type(stageInputs()[1], 'Thika');

    body.querySelector<HTMLButtonElement>('.add-stage')!.click();
    await fixture.whenStable();
    type(stageInputs()[2], 'Githurai');
    buttonByLabel('Move stage 3 up').click();
    await fixture.whenStable();
    expect(stageInputs().map((input) => input.value)).toEqual(['Nairobi CBD', 'Githurai', 'Thika']);

    textButton('Save route').click();

    const request = http.expectOne(ROUTES_URL);
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({
      name: 'Nairobi - Thika',
      routeNumber: null,
      fare: null,
      isActive: true,
      stages: ['Nairobi CBD', 'Githurai', 'Thika'],
    });
    request.flush({});
    await fixture.whenStable();

    expect(saved).toBe(1);
    expect(fixture.componentInstance.visible()).toBe(false);
  });

  it('sends the route number and fare when they are filled in', async () => {
    await open();
    type(body.querySelector<HTMLInputElement>('#name')!, 'Nairobi - Thika');
    type(body.querySelector<HTMLInputElement>('#routeNumber')!, ' 237 ');
    type(body.querySelector<HTMLInputElement>('#fare')!, '100');
    type(stageInputs()[0], 'Nairobi CBD');
    type(stageInputs()[1], 'Thika');

    textButton('Save route').click();

    const request = http.expectOne(ROUTES_URL);
    expect(request.request.body).toMatchObject({ routeNumber: '237', fare: 100 });
    request.flush({});
  });

  it('does not accept a negative fare', async () => {
    await open();
    type(body.querySelector<HTMLInputElement>('#name')!, 'Nairobi - Thika');
    type(body.querySelector<HTMLInputElement>('#fare')!, '-5');
    type(stageInputs()[0], 'Nairobi CBD');
    type(stageInputs()[1], 'Thika');

    textButton('Save route').click();
    await fixture.whenStable();

    http.expectNone(ROUTES_URL);
    expect(body.textContent).toContain('Enter a fare from 0 to 10000');
  });

  it('keeps at least two stages', async () => {
    await open();
    expect(buttonByLabel('Remove stage 1').disabled).toBe(true);

    body.querySelector<HTMLButtonElement>('.add-stage')!.click();
    await fixture.whenStable();
    expect(buttonByLabel('Remove stage 1').disabled).toBe(false);
  });

  it('shows the route being edited and saves it with PATCH', async () => {
    await open(existing);

    expect(body.querySelector<HTMLInputElement>('#name')!.value).toBe('Nairobi - Thika');
    expect(stageInputs().map((input) => input.value)).toEqual(['Nairobi CBD', 'Githurai', 'Thika']);

    textButton('Save route').click();
    const update = http.expectOne(`${ROUTES_URL}/5`);
    expect(update.request.method).toBe('PATCH');
    expect(update.request.body.isActive).toBe(false);
    expect(update.request.body).toMatchObject({ routeNumber: '237', fare: 100 });
    update.flush({});
  });

  it('keeps the pop-up open and shows the reason when the server refuses', async () => {
    await open();
    type(body.querySelector<HTMLInputElement>('#name')!, 'Nairobi - Thika');
    type(stageInputs()[0], 'Nairobi CBD');
    type(stageInputs()[1], 'Thika');

    textButton('Save route').click();
    http
      .expectOne(ROUTES_URL)
      .flush(
        { message: 'A route with this name already exists' },
        { status: 409, statusText: 'Conflict' },
      );
    await fixture.whenStable();

    expect(fixture.componentInstance.visible()).toBe(true);
    expect(body.textContent).toContain('A route with this name already exists');
    expect(saved).toBe(0);
  });

  it('starts empty again after editing a route and opening the pop-up to add one', async () => {
    await open(existing);
    fixture.componentRef.setInput('visible', false);
    fixture.detectChanges();

    await open(null);

    expect(body.querySelector<HTMLInputElement>('#name')!.value).toBe('');
    expect(stageInputs()).toHaveLength(2);
  });
});
