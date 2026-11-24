import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, map, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthResponse, LoginRequest, RegisterRequest } from '../models/auth.model';
import { Role, User } from '../models/user.model';
import { StorageService } from './storage.service';

const TOKEN_KEY = 'safariflow.token';
const USER_KEY = 'safariflow.user';

const ROLE_HOME: Record<Role, string> = {
  admin: '/admin',
  operator: '/admin',
  driver: '/driver',
  passenger: '/passenger',
};

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly storage = inject(StorageService);

  private readonly currentUser = signal<User | null>(this.readStoredUser());
  readonly user = this.currentUser.asReadonly();

  get token(): string | null {
    return this.storage.get(TOKEN_KEY);
  }

  login(request: LoginRequest): Observable<User> {
    return this.http.post<AuthResponse>(`${environment.apiUrl}/auth/login`, request).pipe(
      tap((response) => this.startSession(response)),
      map((response) => response.user),
    );
  }

  register(request: RegisterRequest): Observable<User> {
    return this.http.post<AuthResponse>(`${environment.apiUrl}/auth/register`, request).pipe(
      tap((response) => this.startSession(response)),
      map((response) => response.user),
    );
  }

  logout(): void {
    // lets the server free this login
    this.http.post(`${environment.apiUrl}/auth/logout`, {}).subscribe({ error: () => undefined });
    this.storage.remove(TOKEN_KEY);
    this.storage.remove(USER_KEY);
    this.currentUser.set(null);
    void this.router.navigateByUrl('/auth/login');
  }

  isLoggedIn(): boolean {
    const token = this.token;
    return token !== null && this.currentUser() !== null && !this.isExpired(token);
  }

  /** The landing page for the signed-in user's role, or the login page for guests. */
  homeUrl(): string {
    const user = this.currentUser();
    return user && this.isLoggedIn() ? ROLE_HOME[user.role] : '/auth/login';
  }

  private startSession(response: AuthResponse): void {
    this.storage.set(TOKEN_KEY, response.accessToken);
    this.storage.set(USER_KEY, JSON.stringify(response.user));
    this.currentUser.set(response.user);
  }

  private readStoredUser(): User | null {
    const stored = this.storage.get(USER_KEY);
    if (!stored) {
      return null;
    }
    try {
      return JSON.parse(stored) as User;
    } catch {
      return null;
    }
  }

  private isExpired(token: string): boolean {
    try {
      const payload = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
      const { exp } = JSON.parse(atob(payload)) as { exp?: number };
      return typeof exp === 'number' && exp * 1000 <= Date.now();
    } catch {
      return true;
    }
  }
}
