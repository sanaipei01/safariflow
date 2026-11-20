import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, inject, signal } from '@angular/core';
import { MessageService } from 'primeng/api';
import { finalize } from 'rxjs';
import { DRIVER_STATUS_SEVERITY, Driver } from '../../../core/models/driver.model';
import { DriverService } from '../../../core/services/driver.service';
import { getErrorMessage } from '../../../core/utils/http-error';

@Component({
  selector: 'app-driver-profile',
  standalone: false,
  templateUrl: './driver-profile.html',
  styleUrl: './driver-profile.css',
})
export class DriverProfile implements OnInit {
  private readonly driverService = inject(DriverService);
  private readonly messageService = inject(MessageService);

  protected readonly statusSeverity = DRIVER_STATUS_SEVERITY;
  protected readonly profile = signal<Driver | null>(null);
  protected readonly loading = signal(true);
  protected readonly errorMessage = signal<string | null>(null);
  /** The registration pop-up. It opens by itself for a driver who has not registered yet. */
  protected readonly registering = signal(false);

  ngOnInit(): void {
    this.driverService
      .getMine()
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (driver) => this.profile.set(driver),
        error: (error: unknown) => {
          // a driver who has not registered yet has no registration, which is not an error
          if (error instanceof HttpErrorResponse && error.status === 404) {
            this.registering.set(true);
          } else {
            this.errorMessage.set(getErrorMessage(error));
          }
        },
      });
  }

  protected openRegistration(): void {
    this.registering.set(true);
  }

  protected onSaved(driver: Driver): void {
    this.profile.set(driver);
    this.messageService.add({
      severity: 'success',
      summary: 'Registration submitted',
      detail: 'An admin or operator will review your details. You can check the result here.',
      life: 6000,
    });
  }
}
