import { Component, OnInit, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router } from '@angular/router';
import { filter, map, startWith } from 'rxjs';
import { AuthService } from '../../core/services/auth.service';
import { DriverService } from '../../core/services/driver.service';

interface NavItem {
  label: string;
  url: string;
  icon: string;
}

const NAV_ITEMS: readonly NavItem[] = [
  { label: 'Matatus', url: '/admin/matatus', icon: 'pi-car' },
  { label: 'Saccos', url: '/admin/saccos', icon: 'pi-building' },
  { label: 'Drivers', url: '/admin/drivers', icon: 'pi-users' },
];

const ROLE_LABELS: Record<string, string> = {
  admin: 'Administrator',
  operator: 'Operator',
};

@Component({
  selector: 'app-admin-layout',
  standalone: false,
  templateUrl: './admin-layout.html',
  styleUrl: './admin-layout.css',
})
export class AdminLayout implements OnInit {
  private readonly router = inject(Router);
  private readonly driverService = inject(DriverService);
  protected readonly auth = inject(AuthService);

  protected readonly items = NAV_ITEMS;
  protected readonly today = new Date();
  /** Registrations waiting for review, shown next to Drivers in the menu. */
  protected readonly pendingDrivers = this.driverService.pendingCount;
  /** The menu is always visible on a wide screen and slides in on a narrow one. */
  protected readonly menuOpen = signal(false);

  private readonly url = toSignal(
    this.router.events.pipe(
      filter((event) => event instanceof NavigationEnd),
      map(() => this.router.url),
      startWith(this.router.url),
    ),
    { requireSync: true },
  );

  ngOnInit(): void {
    this.driverService.refreshPendingCount();
  }

  /** The title in the top bar is the section of the menu that is open. */
  protected title(): string {
    return NAV_ITEMS.find((item) => this.url().startsWith(item.url))?.label ?? '';
  }

  protected roleLabel(role: string): string {
    return ROLE_LABELS[role] ?? role;
  }

  protected initials(name: string): string {
    return name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0].toUpperCase())
      .join('');
  }

  protected toggleMenu(): void {
    this.menuOpen.update((open) => !open);
  }

  protected closeMenu(): void {
    this.menuOpen.set(false);
  }
}
