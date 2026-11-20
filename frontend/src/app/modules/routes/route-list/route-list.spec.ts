import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Confirmation, ConfirmationService } from 'primeng/api';
import { environment } from '../../../../environments/environment';
import { MatatuRoute } from '../models/matatu-route.model';
import { RoutesModule } from '../routes-module';
import { RouteList } from './route-list';

const ROUTES_URL = `${environment.apiUrl}/routes`;

const route: MatatuRoute = {
  id: 1,
  name: 'Nairobi - Thika',
  isActive: true,
  stages: [
    { id: 1, name: 'Nairobi CBD', sequence: 1 },
    { id: 2, name: 'Githurai', sequence: 2 },
    { id: 3, name: 'Thika', sequence: 3 },
  ],
};

/** Records the question the screen asks, so a test can answer it without opening the dialog. */
class RecordingConfirmation extends ConfirmationService {
  asked?: Confirmation;

  override confirm(confirmation: Confirmation): this {
    this.asked = confirmation;
    return this;
  }
}

describe('RouteList', () => {
  let fixture: ComponentFixture<RouteList>;
  let page: HTMLElement;
  let http: HttpTestingController;
  let confirmation: RecordingConfirmation;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [RoutesModule],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: ConfirmationService, useClass: RecordingConfirmation },
      ],
    });
    http = TestBed.inject(HttpTestingController);
    confirmation = TestBed.inject(ConfirmationService) as RecordingConfirmation;
    fixture = TestBed.createComponent(RouteList);
    page = fixture.nativeElement as HTMLElement;
  });

  afterEach(() => http.verify());

  async function render(routes: MatatuRoute[]): Promise<void> {
    fixture.detectChanges();
    http.expectOne(ROUTES_URL).flush(routes);
    await fixture.whenStable();
  }

  const deleteButton = () =>
    Array.from(page.querySelectorAll('button')).find(
      (item) => item.textContent?.trim() === 'Delete',
    )!;

  it('shows each route with its stages in order and its status', async () => {
    await render([route]);

    const text = page.textContent!.replace(/\s+/g, ' ');
    expect(text).toContain('Nairobi - Thika');
    expect(text).toContain('Nairobi CBD → Githurai → Thika');
    expect(page.querySelector('.p-tag')?.textContent).toContain('Active');
  });

  it('tells the user when there are no routes', async () => {
    await render([]);

    expect(page.textContent).toContain('No routes found.');
  });

  it('opens the pop-up empty to add a route and reloads after it is saved', async () => {
    await render([]);

    page.querySelector('button')!.click();
    await fixture.whenStable();
    expect(document.body.querySelector('#route-form')).not.toBeNull();
    expect(document.body.textContent).toContain('Add route');

    const dialog = document.body.querySelectorAll<HTMLInputElement>('.stage-row input');
    expect(dialog).toHaveLength(2);
  });

  it('opens the pop-up with the route to edit', async () => {
    await render([route]);

    const edit = Array.from(page.querySelectorAll('button')).find(
      (item) => item.textContent?.trim() === 'Edit',
    )!;
    edit.click();
    await fixture.whenStable();

    expect(document.body.querySelector<HTMLInputElement>('#name')!.value).toBe('Nairobi - Thika');
    expect(
      Array.from(document.body.querySelectorAll<HTMLInputElement>('.stage-row input')).map(
        (input) => input.value,
      ),
    ).toEqual(['Nairobi CBD', 'Githurai', 'Thika']);
  });

  it('deletes a route only after the user confirms', async () => {
    await render([route]);

    deleteButton().click();
    confirmation.asked?.reject?.();
    http.expectNone(`${ROUTES_URL}/1`);

    deleteButton().click();
    confirmation.asked?.accept?.();
    const request = http.expectOne(`${ROUTES_URL}/1`);
    expect(request.request.method).toBe('DELETE');
    request.flush(null);
    http.expectOne(ROUTES_URL).flush([]);
  });
});
