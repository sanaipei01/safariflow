import { Component, OnInit, inject, signal } from '@angular/core';
import { ConfirmationService } from 'primeng/api';
import { Sacco } from '../../../core/models/sacco.model';
import { SaccoService } from '../../../core/services/sacco.service';
import { deleteConfirmation } from '../../../core/utils/delete-confirmation';
import { getErrorMessage } from '../../../core/utils/http-error';
import { MATATU_STATUS_OPTIONS, Matatu, MatatuFilters, MatatuStatus } from '../models/matatu.model';
import { MatatuService } from '../services/matatu.service';

const STATUS_SEVERITY: Record<MatatuStatus, 'success' | 'warn' | 'secondary'> = {
  active: 'success',
  maintenance: 'warn',
  inactive: 'secondary',
};

@Component({
  selector: 'app-matatu-list',
  standalone: false,
  templateUrl: './matatu-list.html',
})
export class MatatuList implements OnInit {
  private readonly matatuService = inject(MatatuService);
  private readonly saccoService = inject(SaccoService);
  private readonly confirmationService = inject(ConfirmationService);

  protected readonly statusOptions = MATATU_STATUS_OPTIONS;
  protected readonly matatus = signal<Matatu[]>([]);
  protected readonly saccos = signal<Sacco[]>([]);
  protected readonly loading = signal(false);
  protected readonly errorMessage = signal<string | null>(null);

  private filters: MatatuFilters = {};

  ngOnInit(): void {
    this.saccoService.list().subscribe({
      next: (saccos) => this.saccos.set(saccos),
      error: (error: unknown) => this.errorMessage.set(getErrorMessage(error)),
    });
    this.load();
  }

  protected severity(status: MatatuStatus): 'success' | 'warn' | 'secondary' {
    return STATUS_SEVERITY[status];
  }

  /** A cleared dropdown sends null, which means "all". */
  protected filterBySacco(saccoId: number | null): void {
    this.filters = { ...this.filters, saccoId: saccoId ?? undefined };
    this.load();
  }

  protected filterByStatus(status: MatatuStatus | null): void {
    this.filters = { ...this.filters, status: status ?? undefined };
    this.load();
  }

  protected confirmRemove(matatu: Matatu): void {
    this.confirmationService.confirm(
      deleteConfirmation(
        'Delete matatu',
        `Delete ${matatu.plateNumber}? This cannot be undone.`,
        () => this.remove(matatu),
      ),
    );
  }

  private remove(matatu: Matatu): void {
    this.matatuService.remove(matatu.id).subscribe({
      next: () => this.load(),
      error: (error: unknown) => this.errorMessage.set(getErrorMessage(error)),
    });
  }

  private load(): void {
    this.loading.set(true);
    this.errorMessage.set(null);
    this.matatuService.list(this.filters).subscribe({
      next: (matatus) => {
        this.matatus.set(matatus);
        this.loading.set(false);
      },
      error: (error: unknown) => {
        this.errorMessage.set(getErrorMessage(error));
        this.loading.set(false);
      },
    });
  }
}
