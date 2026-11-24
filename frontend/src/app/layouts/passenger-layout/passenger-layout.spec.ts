import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router, RouterModule, provideRouter } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { PassengerLayout } from './passenger-layout';

@Component({ template: '', standalone: false })
class EmptyPage {}

describe('PassengerLayout', () => {
  const logout = vi.fn();

  async function render() {
    TestBed.configureTestingModule({
      declarations: [PassengerLayout, EmptyPage],
      imports: [RouterModule],
      providers: [
        provideRouter([{ path: 'passenger/find', component: EmptyPage }]),
        { provide: AuthService, useValue: { logout } },
      ],
    });
    const fixture = TestBed.createComponent(PassengerLayout);
    await fixture.whenStable();
    return { fixture, page: fixture.nativeElement as HTMLElement };
  }

  it('shows the passenger label and the tabs', async () => {
    const { page } = await render();

    expect(page.querySelector('.pill')?.textContent).toContain('Passenger');
    const tabs = Array.from(page.querySelectorAll('.tabs a')).map((tab) => tab.textContent?.trim());
    expect(tabs).toEqual(['Home', 'Find Matatu']);
  });

  it('keeps the Find Matatu tab lit when the address has the chosen stages', async () => {
    const { fixture, page } = await render();

    await TestBed.inject(Router).navigateByUrl('/passenger/find?from=CBD&to=Thika');
    await fixture.whenStable();

    expect(page.querySelector('.tabs a.active')?.textContent?.trim()).toBe('Find Matatu');
  });

  it('logs the passenger out', async () => {
    const { page } = await render();

    page.querySelector<HTMLButtonElement>('button[aria-label="Log out"]')!.click();

    expect(logout).toHaveBeenCalled();
  });
});
