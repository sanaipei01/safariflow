import { Component, OnInit, inject, signal } from '@angular/core';
import { Sacco } from '../../../core/models/sacco.model';
import { SaccoService } from '../../../core/services/sacco.service';
import { getErrorMessage } from '../../../core/utils/http-error';
import { MATATU_STATUSES, Matatu, MatatuFilters, MatatuStatus } from '../models/matatu.model';
import { MatatuService } from '../services/matatu.service';

@Component({
  selector: 'app-matatu-list',
  standalone: false,
  templateUrl: './matatu-list.html',
  styleUrl: './matatu-list.css',
})
export class MatatuList implements OnInit {
  private readonly matatuService = inject(MatatuService);
  private readonly saccoService = inject(SaccoService);

  protected readonly statuses = MATATU_STATUSES;
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

  protected filterBySacco(value: string): void {
    this.filters = { ...this.filters, saccoId: value ? Number(value) : undefined };
    this.load();
  }

  protected filterByStatus(value: string): void {
    this.filters = { ...this.filters, status: value ? (value as MatatuStatus) : undefined };
    this.load();
  }

  protected remove(matatu: Matatu): void {
    if (!window.confirm(`Delete ${matatu.plateNumber}? This cannot be undone.`)) {
      return;
    }
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
