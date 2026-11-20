import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { By } from '@angular/platform-browser';
import { Select } from 'primeng/select';
import { environment } from '../../../../environments/environment';
import { MatatusModule } from '../matatus-module';
import { MatatuForm } from './matatu-form';

const sacco = { id: 1, name: 'Super Metro', registrationNumber: 'SAC/001', phone: null };

describe('MatatuForm', () => {
  let fixture: ComponentFixture<MatatuForm>;
  let page: HTMLElement;
  let http: HttpTestingController;

  beforeEach(async () => {
    TestBed.configureTestingModule({
      imports: [MatatusModule],
      providers: [
        provideRouter([{ path: 'admin/matatus', children: [] }]),
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });
    http = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(MatatuForm);
    page = fixture.nativeElement as HTMLElement;
    fixture.detectChanges();
    http.expectOne(`${environment.apiUrl}/saccos`).flush([sacco]);
    await fixture.whenStable();
  });

  afterEach(() => http.verify());

  function fill(selector: string, value: string): void {
    const field = page.querySelector<HTMLInputElement>(selector)!;
    field.value = value;
    field.dispatchEvent(new Event('input'));
  }

  function chooseSacco(id: number): void {
    const select = fixture.debugElement.query(By.directive(Select)).componentInstance as Select;
    select.updateModel(id);
  }

  function submit(): void {
    page.querySelector<HTMLButtonElement>('button[type=submit]')!.click();
  }

  it('does not send anything while the form is invalid', async () => {
    fill('#plateNumber', 'ABC');
    submit();
    await fixture.whenStable();

    http.expectNone(`${environment.apiUrl}/matatus`);
    expect(page.querySelectorAll('p-message').length).toBeGreaterThan(0);
  });

  it('sends the entered values when the form is valid', async () => {
    fill('#plateNumber', 'kda123a');
    chooseSacco(1);
    submit();

    const request = http.expectOne(`${environment.apiUrl}/matatus`);
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({
      plateNumber: 'kda123a',
      capacity: 14,
      status: 'active',
      saccoId: 1,
    });
    request.flush({});
  });
});

describe('MatatuForm in edit mode', () => {
  it('stays locked until the matatu has loaded, then shows its values', async () => {
    TestBed.configureTestingModule({
      imports: [MatatusModule],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: convertToParamMap({ id: '5' }) } },
        },
      ],
    });
    const http = TestBed.inject(HttpTestingController);
    const fixture = TestBed.createComponent(MatatuForm);
    const page = fixture.nativeElement as HTMLElement;
    const plate = () => page.querySelector<HTMLInputElement>('#plateNumber')!;

    fixture.detectChanges();
    http.expectOne(`${environment.apiUrl}/saccos`).flush([sacco]);
    await fixture.whenStable();
    expect(plate().disabled).toBe(true);

    http.expectOne(`${environment.apiUrl}/matatus/5`).flush({
      id: 5,
      plateNumber: 'KDA 123A',
      capacity: 33,
      status: 'active',
      saccoId: 1,
      sacco,
    });
    await fixture.whenStable();

    expect(plate().disabled).toBe(false);
    expect(plate().value).toBe('KDA 123A');
    http.verify();
  });
});
