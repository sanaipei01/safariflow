import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { environment } from '../../../environments/environment';
import { AuthResponse } from '../models/auth.model';
import { Role } from '../models/user.model';
import { AuthService } from './auth.service';

/** A token that expires far in the future (payload: { "exp": 4102444800 }). */
const VALID_TOKEN = `header.${btoa(JSON.stringify({ exp: 4102444800 }))}.signature`;

const driverResponse: AuthResponse = {
  accessToken: VALID_TOKEN,
  user: {
    id: 2,
    name: 'Demo Driver',
    email: 'driver@safariflow.test',
    phone: null,
    role: Role.DRIVER,
    isActive: true,
  },
};

describe('AuthService', () => {
  let auth: AuthService;
  let http: HttpTestingController;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [
        provideRouter([{ path: 'auth/login', children: [] }]),
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });
    auth = TestBed.inject(AuthService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('starts logged out and points guests to the login page', () => {
    expect(auth.isLoggedIn()).toBe(false);
    expect(auth.homeUrl()).toBe('/auth/login');
  });

  it('stores the session after login and routes the user to their role home', () => {
    auth.login({ email: 'driver@safariflow.test', password: 'Password123!' }).subscribe();
    http.expectOne(`${environment.apiUrl}/auth/login`).flush(driverResponse);

    expect(auth.isLoggedIn()).toBe(true);
    expect(auth.user()?.role).toBe(Role.DRIVER);
    expect(auth.homeUrl()).toBe('/driver');
  });

  it('clears the session on logout', () => {
    auth.login({ email: 'driver@safariflow.test', password: 'Password123!' }).subscribe();
    http.expectOne(`${environment.apiUrl}/auth/login`).flush(driverResponse);

    auth.logout();

    http.expectOne(`${environment.apiUrl}/auth/logout`).flush(null);
    expect(auth.isLoggedIn()).toBe(false);
    expect(auth.token).toBeNull();
  });

  it('treats an expired token as logged out', () => {
    const expired = `header.${btoa(JSON.stringify({ exp: 1 }))}.signature`;
    auth.login({ email: 'driver@safariflow.test', password: 'Password123!' }).subscribe();
    http
      .expectOne(`${environment.apiUrl}/auth/login`)
      .flush({ ...driverResponse, accessToken: expired });

    expect(auth.isLoggedIn()).toBe(false);
  });
});
