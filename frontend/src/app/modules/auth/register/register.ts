import { Component, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { finalize } from 'rxjs';
import { RegisterRequest } from '../../../core/models/auth.model';
import { AuthService } from '../../../core/services/auth.service';
import { getErrorMessage } from '../../../core/utils/http-error';

@Component({
  selector: 'app-register',
  standalone: false,
  templateUrl: './register.html',
  styleUrl: './register.css',
})
export class Register {
  private readonly formBuilder = inject(NonNullableFormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  protected readonly form = this.formBuilder.group({
    name: ['', [Validators.required, Validators.maxLength(100)]],
    email: ['', [Validators.required, Validators.email]],
    phone: ['', Validators.maxLength(20)],
    password: ['', [Validators.required, Validators.minLength(8), Validators.maxLength(72)]],
    role: ['passenger' as RegisterRequest['role']],
  });
  protected readonly loading = signal(false);
  protected readonly errorMessage = signal<string | null>(null);

  protected submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const { phone, ...rest } = this.form.getRawValue();
    this.loading.set(true);
    this.errorMessage.set(null);
    this.auth
      .register({ ...rest, ...(phone ? { phone } : {}) })
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: () => void this.router.navigateByUrl(this.auth.homeUrl()),
        error: (error: unknown) => this.errorMessage.set(getErrorMessage(error)),
      });
  }
}
