import { Component, effect, inject, input, model, output, signal, untracked } from '@angular/core';
import {
  AbstractControl,
  FormControl,
  NonNullableFormBuilder,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { finalize } from 'rxjs';
import { Driver, DriverRegistration } from '../../../core/models/driver.model';
import { DriverService } from '../../../core/services/driver.service';
import { fromIsoDate, toIsoDate } from '../../../core/utils/date';
import { getErrorMessage } from '../../../core/utils/http-error';

const NATIONAL_ID_PATTERN = /^\d{7,8}$/;
const PHONE_PATTERN = /^(\+254|0)[17]\d{8}$/;
const PLATE_PATTERN = /^k[a-z]{2}\s?\d{3}[a-z]?$/i;
const OLDEST_VEHICLE_YEAR = 1990;

/** A Sacco registration number or phone only makes sense with a Sacco name. */
function saccoNeedsName(form: AbstractControl): ValidationErrors | null {
  const { saccoName, saccoRegistrationNumber, saccoPhone } = form.value as Record<string, string>;
  const hasDetails = !!saccoRegistrationNumber?.trim() || !!saccoPhone?.trim();
  return hasDetails && !saccoName?.trim() ? { saccoNeedsName: true } : null;
}

const optional = (value: string): string | undefined => value.trim() || undefined;

@Component({
  selector: 'app-driver-registration-dialog',
  standalone: false,
  templateUrl: './driver-registration-dialog.html',
})
export class DriverRegistrationDialog {
  private readonly formBuilder = inject(NonNullableFormBuilder);
  private readonly driverService = inject(DriverService);

  readonly visible = model(false);
  /** Set when a rejected driver corrects an earlier registration. */
  readonly driver = input<Driver | null>(null);
  readonly saved = output<Driver>();

  protected readonly today = new Date();
  protected readonly newestVehicleYear = this.today.getFullYear() + 1;
  protected readonly oldestVehicleYear = OLDEST_VEHICLE_YEAR;
  protected readonly saving = signal(false);
  protected readonly errorMessage = signal<string | null>(null);

  readonly form = this.formBuilder.group(
    {
      nationalId: ['', [Validators.required, Validators.pattern(NATIONAL_ID_PATTERN)]],
      phone: ['', [Validators.required, Validators.pattern(PHONE_PATTERN)]],
      licenseNumber: [
        '',
        [Validators.required, Validators.pattern(/\S/), Validators.maxLength(30)],
      ],
      licenseExpiry: new FormControl<Date | null>(null, Validators.required),
      psvBadgeNumber: [
        '',
        [Validators.required, Validators.pattern(/\S/), Validators.maxLength(30)],
      ],
      vehiclePlate: ['', [Validators.required, Validators.pattern(PLATE_PATTERN)]],
      vehicleMake: ['', [Validators.required, Validators.pattern(/\S/), Validators.maxLength(50)]],
      vehicleModel: ['', [Validators.required, Validators.pattern(/\S/), Validators.maxLength(50)]],
      vehicleYear: new FormControl<number | null>(null, [
        Validators.required,
        Validators.min(OLDEST_VEHICLE_YEAR),
        Validators.max(this.newestVehicleYear),
      ]),
      vehicleCapacity: new FormControl<number | null>(null, [
        Validators.required,
        Validators.min(1),
        Validators.max(70),
      ]),
      insurancePolicyNumber: [
        '',
        [Validators.required, Validators.pattern(/\S/), Validators.maxLength(50)],
      ],
      insuranceExpiry: new FormControl<Date | null>(null, Validators.required),
      saccoName: ['', Validators.maxLength(100)],
      saccoRegistrationNumber: ['', Validators.maxLength(50)],
      saccoPhone: ['', Validators.pattern(PHONE_PATTERN)],
    },
    { validators: saccoNeedsName },
  );

  constructor() {
    // each time the pop-up opens: a fresh form, or the earlier details to correct
    effect(() => {
      if (this.visible()) {
        untracked(() => this.prepare());
      }
    });
  }

  private prepare(): void {
    this.errorMessage.set(null);
    const driver = this.driver();
    if (!driver) {
      this.form.reset();
      return;
    }
    this.form.reset({
      ...driver,
      licenseExpiry: fromIsoDate(driver.licenseExpiry),
      insuranceExpiry: fromIsoDate(driver.insuranceExpiry),
      saccoName: driver.saccoName ?? '',
      saccoRegistrationNumber: driver.saccoRegistrationNumber ?? '',
      saccoPhone: driver.saccoPhone ?? '',
    });
  }

  protected showError(control: AbstractControl): boolean {
    return control.touched && control.invalid;
  }

  protected close(): void {
    this.visible.set(false);
  }

  protected submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const value = this.form.getRawValue();
    const { licenseExpiry, insuranceExpiry, vehicleYear, vehicleCapacity } = value;
    if (!licenseExpiry || !insuranceExpiry || vehicleYear === null || vehicleCapacity === null) {
      return;
    }

    const registration: DriverRegistration = {
      nationalId: value.nationalId.trim(),
      phone: value.phone.trim(),
      licenseNumber: value.licenseNumber.trim(),
      licenseExpiry: toIsoDate(licenseExpiry),
      psvBadgeNumber: value.psvBadgeNumber.trim(),
      vehiclePlate: value.vehiclePlate.trim(),
      vehicleMake: value.vehicleMake.trim(),
      vehicleModel: value.vehicleModel.trim(),
      vehicleYear,
      vehicleCapacity,
      insurancePolicyNumber: value.insurancePolicyNumber.trim(),
      insuranceExpiry: toIsoDate(insuranceExpiry),
      saccoName: optional(value.saccoName),
      saccoRegistrationNumber: optional(value.saccoRegistrationNumber),
      saccoPhone: optional(value.saccoPhone),
    };

    const request$ = this.driver()
      ? this.driverService.updateMine(registration)
      : this.driverService.register(registration);

    this.saving.set(true);
    this.errorMessage.set(null);
    request$.pipe(finalize(() => this.saving.set(false))).subscribe({
      next: (driver) => {
        this.visible.set(false);
        this.saved.emit(driver);
      },
      error: (error: unknown) => this.errorMessage.set(getErrorMessage(error)),
    });
  }
}
