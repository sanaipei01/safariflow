import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { environment } from '../../../environments/environment';
import { buildDriver } from '../../core/testing/driver.fixture';
import { AdminLayout } from './admin-layout';
import { LayoutsModule } from '../layouts-module';

@Component({ template: '', standalone: false })
class EmptyPage {}

const user = { id: 1, name: 'Grace Wanjiku', email: 'g@x.test', phone: null, role: 'admin' };

describe('AdminLayout', () => {
  let fixture: ComponentFixture<AdminLayout>;
  let page: HTMLElement;
  let http: HttpTestingController;
  let router: Router;

  beforeEach(() => {
    localStorage.setItem('safariflow.user', JSON.stringify(user));
    TestBed.configureTestingModule({
      declarations: [EmptyPage],
      imports: [LayoutsModule],
      providers: [
        provideRouter([
          { path: 'admin/matatus', component: EmptyPage },
          { path: 'admin/drivers', component: EmptyPage },
        ]),
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });
    http = TestBed.inject(HttpTestingController);
    router = TestBed.inject(Router);
  });

  afterEach(() => {
    localStorage.clear();
    http.verify();
  });

  async function render(pending = 0): Promise<void> {
    fixture = TestBed.createComponent(AdminLayout);
    page = fixture.nativeElement as HTMLElement;
    await router.navigateByUrl('/admin/matatus');
    fixture.detectChanges();
    http
      .expectOne(`${environment.apiUrl}/drivers?status=pending`)
      .flush(Array.from({ length: pending }, () => buildDriver()));
    await fixture.whenStable();
  }

  it('lists the sections of the admin area in the sidebar', async () => {
    await render();

    const links = Array.from(page.querySelectorAll('nav a')).map((link) =>
      link.textContent?.trim(),
    );
    expect(links).toEqual(['Matatus', 'Saccos', 'Routes', 'Drivers']);
  });

  it('shows the open section and today in the top bar', async () => {
    await render();

    expect(page.querySelector('h1')?.textContent).toBe('Matatus');
    await router.navigateByUrl('/admin/drivers');
    await fixture.whenStable();
    expect(page.querySelector('h1')?.textContent).toBe('Drivers');
  });

  it('shows who is signed in with their initials', async () => {
    await render();

    expect(page.querySelector('.who')?.textContent).toContain('Grace Wanjiku');
    expect(page.querySelector('.who')?.textContent).toContain('Administrator');
    expect(page.querySelector('.avatar')?.textContent).toBe('GW');
  });

  it('shows how many registrations are waiting next to Drivers', async () => {
    await render(3);

    expect(page.querySelector('.count')?.textContent?.trim()).toBe('3');
  });

  it('hides the count when nothing is waiting', async () => {
    await render(0);

    expect(page.querySelector('.count')).toBeNull();
  });

  it('opens and closes the menu on a narrow screen', async () => {
    await render();
    const sidebar = page.querySelector('.sidebar')!;

    (page.querySelector('.menu-button') as HTMLButtonElement).click();
    await fixture.whenStable();
    expect(sidebar.classList).toContain('open');

    (page.querySelector('nav a') as HTMLAnchorElement).click();
    await fixture.whenStable();
    expect(sidebar.classList).not.toContain('open');
  });
});
