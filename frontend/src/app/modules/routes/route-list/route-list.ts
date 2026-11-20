import { Component, OnInit, inject, signal } from '@angular/core';
import { ConfirmationService } from 'primeng/api';
import { deleteConfirmation } from '../../../core/utils/delete-confirmation';
import { getErrorMessage } from '../../../core/utils/http-error';
import { MatatuRoute } from '../models/matatu-route.model';
import { RouteService } from '../services/route.service';

@Component({
  selector: 'app-route-list',
  standalone: false,
  templateUrl: './route-list.html',
})
export class RouteList implements OnInit {
  private readonly routeService = inject(RouteService);
  private readonly confirmationService = inject(ConfirmationService);

  protected readonly routes = signal<MatatuRoute[]>([]);
  protected readonly loading = signal(false);
  protected readonly errorMessage = signal<string | null>(null);

  /** The add and edit pop-up. `editing` is the route being changed, or null when adding. */
  protected readonly dialogOpen = signal(false);
  protected readonly editing = signal<MatatuRoute | null>(null);

  ngOnInit(): void {
    this.load();
  }

  protected openAdd(): void {
    this.editing.set(null);
    this.dialogOpen.set(true);
  }

  protected openEdit(route: MatatuRoute): void {
    this.editing.set(route);
    this.dialogOpen.set(true);
  }

  /** The stops in order, for example "Nairobi CBD → Githurai → Thika". */
  protected stageSummary(route: MatatuRoute): string {
    return route.stages.map((stage) => stage.name).join(' → ');
  }

  protected confirmRemove(route: MatatuRoute): void {
    this.confirmationService.confirm(
      deleteConfirmation(
        'Delete route',
        `Delete ${route.name} and its stages? This cannot be undone.`,
        () => this.remove(route),
      ),
    );
  }

  private remove(route: MatatuRoute): void {
    this.routeService.remove(route.id).subscribe({
      next: () => this.load(),
      error: (error: unknown) => this.errorMessage.set(getErrorMessage(error)),
    });
  }

  protected load(): void {
    this.loading.set(true);
    this.errorMessage.set(null);
    this.routeService.list().subscribe({
      next: (routes) => {
        this.routes.set(routes);
        this.loading.set(false);
      },
      error: (error: unknown) => {
        this.errorMessage.set(getErrorMessage(error));
        this.loading.set(false);
      },
    });
  }
}
