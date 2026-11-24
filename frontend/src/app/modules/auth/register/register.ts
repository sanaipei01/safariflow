import { Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NonNullableFormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { finalize } from 'rxjs';
import { RegisterRequest } from '../../../core/models/auth.model';
import { AuthService } from '../../../core/services/auth.service';
import { getErrorMessage } from '../../../core/utils/http-error';
import {
  EMAIL_PATTERN,
  PASSWORD_RULES,
  passwordRulesValidator,
} from '../../../core/utils/password-rules';

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
    email: [
      '',
      [Validators.required, Validators.pattern(EMAIL_PATTERN), Validators.maxLength(254)],
    ],
    phone: ['', Validators.maxLength(20)],
    password: ['', [Validators.required, passwordRulesValidator]],
    role: ['passenger' as RegisterRequest['role']],
  });
  private readonly password = toSignal(this.form.controls.password.valueChanges, {
    initialValue: '',
  });
  protected readonly passwordRules = computed(() =>
    PASSWORD_RULES.map((rule) => ({ label: rule.label, met: rule.isMet(this.password()) })),
  );
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
