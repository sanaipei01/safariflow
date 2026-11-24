import { HttpErrorResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { provideRouter } from '@angular/router';
import { throwError } from 'rxjs';
import { AuthService } from '../../../core/services/auth.service';
import { Login } from './login';

async function loginFailingWith(status: number, message: string) {
  const login = () => throwError(() => new HttpErrorResponse({ status, error: { message } }));
  TestBed.configureTestingModule({
    declarations: [Login],
    imports: [ReactiveFormsModule],
    providers: [
      provideRouter([]),
      { provide: AuthService, useValue: { login, homeUrl: () => '/' } },
    ],
  });
  const fixture = TestBed.createComponent(Login);
  await fixture.whenStable();
  const page = fixture.nativeElement as HTMLElement;
  for (const [selector, value] of [
    ['#email', 'driver@safariflow.test'],
    ['#password', 'wrong'],
  ]) {
    const input = page.querySelector<HTMLInputElement>(selector)!;
    input.value = value;
    input.dispatchEvent(new Event('input'));
  }
  page.querySelector('form')!.dispatchEvent(new Event('submit'));
  await fixture.whenStable();
  return page.querySelector('.form-error')?.textContent;
}

describe('Login', () => {
  it.each([
    [401, 'Incorrect password. You have 4 attempts left.'],
    [401, 'No account was found with this email. Check it or register.'],
    [429, 'Too many failed login attempts. Try again in 15 minutes.'],
    [503, 'The system is at its limit of 100 people signed in at once.'],
  ])('shows the server message for a %i: %s', async (status, message) => {
    expect(await loginFailingWith(status, message)).toContain(message);
  });
});
