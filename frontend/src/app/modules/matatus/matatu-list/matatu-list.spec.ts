import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { ConfirmationService } from 'primeng/api';
import { environment } from '../../../../environments/environment';
import { Matatu } from '../models/matatu.model';
import { MatatusModule } from '../matatus-module';
import { MatatuList } from './matatu-list';

const sacco = { id: 1, name: 'Super Metro', registrationNumber: 'SAC/001', phone: null };

const matatu: Matatu = {
  id: 1,
  plateNumber: 'KDA 123A',
  capacity: 33,
  status: 'active',
  saccoId: 1,
  sacco,
};

describe('MatatuList', () => {
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [MatatusModule],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        ConfirmationService,
      ],
    });
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  async function render(matatus: Matatu[]): Promise<HTMLElement> {
    const fixture = TestBed.createComponent(MatatuList);
    fixture.detectChanges();
    http.expectOne(`${environment.apiUrl}/saccos`).flush([sacco]);
    http.expectOne(`${environment.apiUrl}/matatus`).flush(matatus);
    await fixture.whenStable();
    return fixture.nativeElement as HTMLElement;
  }

  it('shows each matatu with its SACCO and status', async () => {
    const page = await render([matatu]);

    expect(page.textContent).toContain('KDA 123A');
    expect(page.textContent).toContain('Super Metro');
    expect(page.textContent).toContain('33 seats');
    expect(page.querySelector('.p-tag')?.textContent).toContain('Active');
  });

  it('tells the user when there are no matatus', async () => {
    const page = await render([]);

    expect(page.textContent).toContain('No matatus found.');
  });
});
