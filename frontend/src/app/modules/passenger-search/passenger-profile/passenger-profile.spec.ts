import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Role, User } from '../../../core/models/user.model';
import { AuthService } from '../../../core/services/auth.service';
import { PassengerSearchModule } from '../passenger-search-module';
import { PassengerProfile } from './passenger-profile';

const passenger: User = {
  id: 4,
  name: 'Demo Passenger',
  email: 'passenger@safariflow.test',
  phone: null,
  role: Role.PASSENGER,
  isActive: true,
};

describe('PassengerProfile', () => {
  const logout = vi.fn();

  async function render(user: User = passenger) {
    TestBed.configureTestingModule({
      imports: [PassengerSearchModule],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: { user: signal(user), logout } },
      ],
    });
    const fixture = TestBed.createComponent(PassengerProfile);
    await fixture.whenStable();
    return fixture.nativeElement as HTMLElement;
  }

  it('shows the name, email and phone', async () => {
    const page = await render({ ...passenger, phone: '0712345678' });

    expect(page.textContent).toContain('Demo Passenger');
    expect(page.textContent).toContain('passenger@safariflow.test');
    expect(page.textContent).toContain('0712345678');
  });

  it('says when no phone number was added', async () => {
    const page = await render();

    expect(page.textContent).toContain('Not added');
  });

  it('logs the passenger out', async () => {
    const page = await render();

    page.querySelector<HTMLButtonElement>('button')!.click();

    expect(logout).toHaveBeenCalled();
  });
});
