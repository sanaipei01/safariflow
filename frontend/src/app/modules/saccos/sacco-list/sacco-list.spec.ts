import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Confirmation, ConfirmationService } from 'primeng/api';
import { environment } from '../../../../environments/environment';
import { Sacco } from '../../../core/models/sacco.model';
import { SaccosModule } from '../saccos-module';
import { SaccoList } from './sacco-list';

const SACCOS_URL = `${environment.apiUrl}/saccos`;

const superMetro: Sacco = {
  id: 1,
  name: 'Super Metro',
  registrationNumber: 'SAC/001',
  phone: null,
};

/** Records the question the screen asks, so a test can answer it without opening the dialog. */
class RecordingConfirmation extends ConfirmationService {
  asked?: Confirmation;

  override confirm(confirmation: Confirmation): this {
    this.asked = confirmation;
    return this;
  }
}

describe('SaccoList', () => {
  let fixture: ComponentFixture<SaccoList>;
  let page: HTMLElement;
  let http: HttpTestingController;
  let confirmation: RecordingConfirmation;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [SaccosModule],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: ConfirmationService, useClass: RecordingConfirmation },
      ],
    });
    http = TestBed.inject(HttpTestingController);
    confirmation = TestBed.inject(ConfirmationService) as RecordingConfirmation;
    fixture = TestBed.createComponent(SaccoList);
    page = fixture.nativeElement as HTMLElement;
  });

  afterEach(() => http.verify());

  async function render(saccos: Sacco[]): Promise<void> {
    fixture.detectChanges();
    http.expectOne(SACCOS_URL).flush(saccos);
    await fixture.whenStable();
  }

  /** The last match, because the pop-up's "Add Sacco" comes after the one in the page header. */
  const button = (label: string) =>
    Array.from(document.body.querySelectorAll('button'))
      .filter((item) => item.textContent?.trim() === label)
      .at(-1)!;

  async function type(selector: string, value: string): Promise<void> {
    const input = document.body.querySelector<HTMLInputElement>(selector)!;
    input.value = value;
    input.dispatchEvent(new Event('input'));
    await fixture.whenStable();
  }

  it('lists the Saccos the operator has added', async () => {
    await render([superMetro]);

    expect(page.textContent).toContain('SAC/001');
  });

  it('tells the user when there are no Saccos', async () => {
    await render([]);

    expect(page.textContent).toContain('No Saccos found.');
  });

  it('adds a Sacco, leaving out an empty phone number', async () => {
    await render([]);
    button('Add Sacco').click();
    await fixture.whenStable();

    await type('#name', ' Metro Trans ');
    await type('#registrationNumber', 'SAC/002');
    button('Add Sacco').click();

    const create = http.expectOne(SACCOS_URL);
    expect(create.request.method).toBe('POST');
    expect(create.request.body).toEqual({ name: 'Metro Trans', registrationNumber: 'SAC/002' });
    create.flush({ ...superMetro, id: 2 });
    http.expectOne(SACCOS_URL).flush([superMetro]);
  });

  it('does not send a Sacco without a name', async () => {
    await render([]);
    button('Add Sacco').click();
    await fixture.whenStable();

    await type('#registrationNumber', 'SAC/002');
    button('Add Sacco').click();
    await fixture.whenStable();

    http.expectNone(SACCOS_URL);
    expect(document.body.querySelector('p-message')).not.toBeNull();
  });

  it('shows the server message when a Sacco already exists', async () => {
    await render([]);
    button('Add Sacco').click();
    await fixture.whenStable();
    await type('#name', 'Super Metro');
    await type('#registrationNumber', 'SAC/001');

    button('Add Sacco').click();
    http
      .expectOne(SACCOS_URL)
      .flush(
        { message: 'A SACCO with this name already exists' },
        { status: 409, statusText: 'Conflict' },
      );
    await fixture.whenStable();

    expect(document.body.textContent).toContain('A SACCO with this name already exists');
  });

  it('edits a Sacco from its current details', async () => {
    await render([superMetro]);
    button('Edit').click();
    await fixture.whenStable();

    expect(document.body.querySelector<HTMLInputElement>('#name')!.value).toBe('Super Metro');
    await type('#phone', '0722000000');
    button('Save changes').click();

    const update = http.expectOne(`${SACCOS_URL}/1`);
    expect(update.request.method).toBe('PATCH');
    expect(update.request.body).toEqual({
      name: 'Super Metro',
      registrationNumber: 'SAC/001',
      phone: '0722000000',
    });
    update.flush(superMetro);
    http.expectOne(SACCOS_URL).flush([superMetro]);
  });

  it('deletes a Sacco only after the user confirms', async () => {
    await render([superMetro]);

    button('Delete').click();
    confirmation.asked?.reject?.();
    http.expectNone(`${SACCOS_URL}/1`);

    button('Delete').click();
    confirmation.asked?.accept?.();
    http.expectOne(`${SACCOS_URL}/1`).flush(null);
    http.expectOne(SACCOS_URL).flush([]);
  });

  it('shows why a Sacco could not be deleted', async () => {
    await render([superMetro]);

    button('Delete').click();
    confirmation.asked?.accept?.();
    http
      .expectOne(`${SACCOS_URL}/1`)
      .flush(
        { message: 'This SACCO still has matatus. Move or delete them first' },
        { status: 409, statusText: 'Conflict' },
      );
    await fixture.whenStable();

    expect(page.textContent).toContain('still has matatus');
  });
});
