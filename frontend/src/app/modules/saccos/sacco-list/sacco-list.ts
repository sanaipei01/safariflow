import { Component, OnInit, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, Validators } from '@angular/forms';
import { ConfirmationService } from 'primeng/api';
import { finalize } from 'rxjs';
import { Sacco } from '../../../core/models/sacco.model';
import { SaccoService } from '../../../core/services/sacco.service';
import { deleteConfirmation } from '../../../core/utils/delete-confirmation';
import { getErrorMessage } from '../../../core/utils/http-error';

@Component({
  selector: 'app-sacco-list',
  standalone: false,
  templateUrl: './sacco-list.html',
})
export class SaccoList implements OnInit {
  private readonly formBuilder = inject(NonNullableFormBuilder);
  private readonly saccoService = inject(SaccoService);
  private readonly confirmationService = inject(ConfirmationService);

  protected readonly saccos = signal<Sacco[]>([]);
  protected readonly loading = signal(false);
  protected readonly errorMessage = signal<string | null>(null);

  /** The add and edit pop-up. `editing` is the Sacco being changed, or null when adding. */
  protected readonly dialogOpen = signal(false);
  protected readonly editing = signal<Sacco | null>(null);
  protected readonly saving = signal(false);
  protected readonly formError = signal<string | null>(null);

  protected readonly form = this.formBuilder.group({
    name: ['', [Validators.required, Validators.pattern(/\S/), Validators.maxLength(100)]],
    registrationNumber: [
      '',
      [Validators.required, Validators.pattern(/\S/), Validators.maxLength(50)],
    ],
    phone: ['', Validators.maxLength(20)],
  });

  ngOnInit(): void {
    this.load();
  }

  protected openAdd(): void {
    this.openDialog(null);
    this.form.reset();
  }

  protected openEdit(sacco: Sacco): void {
    this.openDialog(sacco);
    this.form.reset({
      name: sacco.name,
      registrationNumber: sacco.registrationNumber,
      phone: sacco.phone ?? '',
    });
  }

  protected closeDialog(): void {
    this.dialogOpen.set(false);
  }

  protected save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const value = this.form.getRawValue();
    const name = value.name.trim();
    const registrationNumber = value.registrationNumber.trim();
    const phone = value.phone.trim();
    const sacco = this.editing();

    // when editing, an empty phone is sent so that an old number can be removed
    const request$ = sacco
      ? this.saccoService.update(sacco.id, { name, registrationNumber, phone })
      : this.saccoService.create({ name, registrationNumber, phone: phone || undefined });

    this.saving.set(true);
    this.formError.set(null);
    request$.pipe(finalize(() => this.saving.set(false))).subscribe({
      next: () => {
        this.dialogOpen.set(false);
        this.load();
      },
      error: (error: unknown) => this.formError.set(getErrorMessage(error)),
    });
  }

  protected confirmRemove(sacco: Sacco): void {
    this.confirmationService.confirm(
      deleteConfirmation('Delete Sacco', `Delete ${sacco.name}? This cannot be undone.`, () =>
        this.remove(sacco),
      ),
    );
  }

  private remove(sacco: Sacco): void {
    this.errorMessage.set(null);
    this.saccoService.remove(sacco.id).subscribe({
      next: () => this.load(),
      error: (error: unknown) => this.errorMessage.set(getErrorMessage(error)),
    });
  }

  private openDialog(sacco: Sacco | null): void {
    this.editing.set(sacco);
    this.formError.set(null);
    this.dialogOpen.set(true);
  }

  private load(): void {
    this.loading.set(true);
    this.saccoService.list().subscribe({
      next: (saccos) => {
        this.saccos.set(saccos);
        this.loading.set(false);
      },
      error: (error: unknown) => {
        this.errorMessage.set(getErrorMessage(error));
        this.loading.set(false);
      },
    });
  }
}
