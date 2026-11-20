import { Component, OnInit, inject, signal } from '@angular/core';
import { FormControl, Validators } from '@angular/forms';
import { Observable } from 'rxjs';
import {
  DRIVER_STATUS_OPTIONS,
  DRIVER_STATUS_SEVERITY,
  Driver,
  DriverStatus,
} from '../../../core/models/driver.model';
import { DriverService } from '../../../core/services/driver.service';
import { getErrorMessage } from '../../../core/utils/http-error';

@Component({
  selector: 'app-driver-list',
  standalone: false,
  templateUrl: './driver-list.html',
})
export class DriverList implements OnInit {
  private readonly driverService = inject(DriverService);

  protected readonly statusOptions = DRIVER_STATUS_OPTIONS;
  protected readonly drivers = signal<Driver[]>([]);
  protected readonly loading = signal(false);
  protected readonly errorMessage = signal<string | null>(null);

  /** The registration open in the review pop-up, if any. */
  protected readonly reviewing = signal<Driver | null>(null);
  /** True while the operator is typing the reason for a rejection. */
  protected readonly rejecting = signal(false);
  protected readonly reason = new FormControl('', {
    nonNullable: true,
    validators: [Validators.required, Validators.pattern(/\S/), Validators.maxLength(255)],
  });

  private statusFilter: DriverStatus | undefined;

  ngOnInit(): void {
    this.load();
  }

  /** The table rows are untyped in the template, so the tag colour comes from here. */
  protected severity(status: DriverStatus): 'warn' | 'success' | 'danger' {
    return DRIVER_STATUS_SEVERITY[status];
  }

  /** A cleared dropdown sends null, which means "all". */
  protected filterByStatus(status: DriverStatus | null): void {
    this.statusFilter = status ?? undefined;
    this.load();
  }

  protected review(driver: Driver): void {
    this.errorMessage.set(null);
    this.rejecting.set(false);
    this.reason.reset();
    this.reviewing.set(driver);
  }

  protected closeReview(): void {
    this.reviewing.set(null);
  }

  protected approve(driver: Driver): void {
    this.decide(this.driverService.approve(driver.id));
  }

  protected startReject(): void {
    this.rejecting.set(true);
  }

  protected cancelReject(): void {
    this.rejecting.set(false);
  }

  protected confirmReject(driver: Driver): void {
    if (this.reason.invalid) {
      this.reason.markAsTouched();
      return;
    }
    this.decide(this.driverService.reject(driver.id, this.reason.value.trim()));
  }

  private decide(request: Observable<Driver>): void {
    this.errorMessage.set(null);
    this.reviewing.set(null);
    request.subscribe({
      next: () => this.reload(),
      error: (error: unknown) => {
        this.errorMessage.set(getErrorMessage(error));
        this.reload();
      },
    });
  }

  /** After a decision both the list and the number in the menu change. */
  private reload(): void {
    this.load();
    this.driverService.refreshPendingCount();
  }

  private load(): void {
    this.loading.set(true);
    this.driverService.list(this.statusFilter).subscribe({
      next: (drivers) => {
        this.drivers.set(drivers);
        this.loading.set(false);
      },
      error: (error: unknown) => {
        this.errorMessage.set(getErrorMessage(error));
        this.loading.set(false);
      },
    });
  }
}
