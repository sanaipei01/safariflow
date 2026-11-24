import { HttpErrorResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { AuthService } from '../../../core/services/auth.service';
import { Register } from './register';

function type(page: HTMLElement, selector: string, value: string): void {
  const input = page.querySelector<HTMLInputElement>(selector)!;
  input.value = value;
  input.dispatchEvent(new Event('input'));
}

describe('Register', () => {
  const register = vi.fn();

  async function render() {
    TestBed.configureTestingModule({
      declarations: [Register],
      imports: [ReactiveFormsModule],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: { register, homeUrl: () => '/' } },
      ],
    });
    const fixture = TestBed.createComponent(Register);
    await fixture.whenStable();
    return { fixture, page: fixture.nativeElement as HTMLElement };
  }

  async function submit(password: string) {
    const { fixture, page } = await render();
    type(page, '#name', 'New Passenger');
    type(page, '#email', 'new@example.com');
    type(page, '#password', password);
    page.querySelector('form')!.dispatchEvent(new Event('submit'));
    await fixture.whenStable();
    return page;
  }

  beforeEach(() => register.mockReset().mockReturnValue(of({})));

  it('ticks each password rule as it is met', async () => {
    const { fixture, page } = await render();
    const met = () => page.querySelectorAll('.password-rules li.met').length;

    expect(met()).toBe(0);
    type(page, '#password', 'Password123!');
    await fixture.whenStable();

    expect(met()).toBe(5);
  });

  it('does not send a password that breaks a rule', async () => {
    await submit('password');

    expect(register).not.toHaveBeenCalled();
  });

  it('registers with a valid password', async () => {
    await submit('Password123!');

    expect(register).toHaveBeenCalledWith({
      name: 'New Passenger',
      email: 'new@example.com',
      password: 'Password123!',
      role: 'passenger',
    });
  });

  it('shows the message when the email is already registered', async () => {
    const error = { message: 'An account with this email already exists' };
    register.mockReturnValue(throwError(() => new HttpErrorResponse({ status: 409, error })));

    const page = await submit('Password123!');

    expect(page.querySelector('.form-error')?.textContent).toContain('already exists');
  });
});
