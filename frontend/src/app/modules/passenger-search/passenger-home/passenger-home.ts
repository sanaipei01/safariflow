import { Component, OnInit, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { getErrorMessage } from '../../../core/utils/http-error';
import { RouteSummary, SearchQuery } from '../models/route-match.model';
import { RecentSearchesService } from '../services/recent-searches.service';
import { RouteSearchService } from '../services/route-search.service';

export function greetingFor(hour: number): string {
  if (hour < 12) {
    return 'Good morning';
  }
  return hour < 17 ? 'Good afternoon' : 'Good evening';
}

@Component({
  selector: 'app-passenger-home',
  standalone: false,
  templateUrl: './passenger-home.html',
  styleUrl: './passenger-home.css',
})
export class PassengerHome implements OnInit {
  private readonly formBuilder = inject(NonNullableFormBuilder);
  private readonly searchService = inject(RouteSearchService);
  private readonly router = inject(Router);

  readonly form = this.formBuilder.group({
    from: ['', Validators.required],
    to: ['', Validators.required],
  });
  protected readonly greeting = greetingFor(new Date().getHours());
  protected readonly stages = signal<string[]>([]);
  protected readonly recent = inject(RecentSearchesService).list();
  protected readonly popular = signal<RouteSummary[]>([]);
  protected readonly errorMessage = signal<string | null>(null);

  ngOnInit(): void {
    this.searchService.popular().subscribe({
      next: (routes) => this.popular.set(routes),
      error: () => this.popular.set([]),
    });
    this.searchService.stages().subscribe({
      next: (stages) => this.stages.set(stages),
      error: (error: unknown) => this.errorMessage.set(getErrorMessage(error)),
    });
  }

  protected search(): void {
    const query = this.form.getRawValue();
    if (!query.from || !query.to) {
      this.errorMessage.set('Choose where you are leaving from and where you are going.');
    } else if (query.from === query.to) {
      this.errorMessage.set('Choose two different stages.');
    } else {
      this.open(query);
    }
  }

  /** Opens the results from the first stage of a route to its last. */
  protected openRoute(route: RouteSummary): void {
    this.open({ from: route.stops[0], to: route.stops[route.stops.length - 1] });
  }

  protected open(query: SearchQuery): void {
    this.router.navigate(['/passenger/find'], { queryParams: query });
  }
}
