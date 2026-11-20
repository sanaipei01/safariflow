import { Component, OnInit, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { finalize } from 'rxjs';
import { Sacco } from '../../../core/models/sacco.model';
import { SaccoService } from '../../../core/services/sacco.service';
import { getErrorMessage } from '../../../core/utils/http-error';
import { MATATU_STATUS_OPTIONS, MatatuStatus } from '../models/matatu.model';
import { MatatuService } from '../services/matatu.service';

/** Kenyan plates such as "KDA 123A" or "KDA 123"; the API stores them in one format. */
const PLATE_PATTERN = /^k[a-z]{2}\s?\d{3}[a-z]?$/i;

@Component({
  selector: 'app-matatu-form',
  standalone: false,
  templateUrl: './matatu-form.html',
})
export class MatatuForm implements OnInit {
  private readonly formBuilder = inject(NonNullableFormBuilder);
  private readonly matatuService = inject(MatatuService);
  private readonly saccoService = inject(SaccoService);
  private readonly router = inject(Router);
  private readonly matatuId = Number(inject(ActivatedRoute).snapshot.paramMap.get('id')) || null;

  protected readonly isEdit = this.matatuId !== null;
  protected readonly statusOptions = MATATU_STATUS_OPTIONS;
  protected readonly saccos = signal<Sacco[]>([]);
  protected readonly loading = signal(false);
  protected readonly errorMessage = signal<string | null>(null);

  protected readonly form = this.formBuilder.group({
    plateNumber: ['', [Validators.required, Validators.pattern(PLATE_PATTERN)]],
    capacity: [14, [Validators.required, Validators.min(1), Validators.max(70)]],
    status: ['active' as MatatuStatus],
    saccoId: [0, [Validators.required, Validators.min(1)]],
  });

  ngOnInit(): void {
    this.saccoService.list().subscribe({
      next: (saccos) => this.saccos.set(saccos),
      error: (error: unknown) => this.errorMessage.set(getErrorMessage(error)),
    });

    if (this.matatuId) {
      // keep the form locked until the matatu has loaded, so typing is not overwritten
      this.form.disable();
      this.matatuService.get(this.matatuId).subscribe({
        next: ({ plateNumber, capacity, status, saccoId }) => {
          this.form.enable();
          this.form.patchValue({ plateNumber, capacity, status, saccoId });
        },
        error: (error: unknown) => this.errorMessage.set(getErrorMessage(error)),
      });
    }
  }

  protected submit(): void {
    if (this.form.disabled) {
      return;
    }
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const request = this.form.getRawValue();
    this.loading.set(true);
    this.errorMessage.set(null);
    const save$ = this.matatuId
      ? this.matatuService.update(this.matatuId, request)
      : this.matatuService.create(request);

    save$.pipe(finalize(() => this.loading.set(false))).subscribe({
      next: () => void this.router.navigateByUrl('/admin/matatus'),
      error: (error: unknown) => this.errorMessage.set(getErrorMessage(error)),
    });
  }
}
