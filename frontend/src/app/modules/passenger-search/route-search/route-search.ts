import { Component, OnInit, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { finalize } from 'rxjs';
import { getErrorMessage } from '../../../core/utils/http-error';
import { RouteMatch, SearchQuery } from '../models/route-match.model';
import { RecentSearchesService } from '../services/recent-searches.service';
import { RouteSearchService } from '../services/route-search.service';

@Component({
  selector: 'app-route-search',
  standalone: false,
  templateUrl: './route-search.html',
  styleUrl: './route-search.css',
})
export class RouteSearch implements OnInit {
  private readonly formBuilder = inject(NonNullableFormBuilder);
  private readonly searchService = inject(RouteSearchService);
  private readonly recentSearches = inject(RecentSearchesService);
  private readonly route = inject(ActivatedRoute);

  readonly form = this.formBuilder.group({
    from: ['', Validators.required],
    to: ['', Validators.required],
  });
  protected readonly stages = signal<string[]>([]);
  protected readonly matches = signal<RouteMatch[] | null>(null);
  protected readonly searched = signal<SearchQuery | null>(null);
  protected readonly recent = signal<SearchQuery[]>(this.recentSearches.list());
  protected readonly loading = signal(false);
  protected readonly errorMessage = signal<string | null>(null);

  ngOnInit(): void {
    this.searchService.stages().subscribe({
      next: (stages) => this.stages.set(stages),
      error: (error: unknown) => this.errorMessage.set(getErrorMessage(error)),
    });

    // the Home page sends the stages it was given in the address
    const { queryParamMap } = this.route.snapshot;
    const from = queryParamMap.get('from');
    const to = queryParamMap.get('to');
    if (from && to) {
      this.useRecent({ from, to });
    }
  }

  protected swap(): void {
    const { from, to } = this.form.getRawValue();
    this.form.setValue({ from: to, to: from });
  }

  protected search(): void {
    const query = this.form.getRawValue();
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    if (query.from === query.to) {
      this.errorMessage.set('Choose two different stages.');
      return;
    }

    this.loading.set(true);
    this.errorMessage.set(null);
    this.searchService
      .search(query)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (matches) => {
          this.matches.set(matches);
          this.searched.set(query);
          this.recent.set(this.recentSearches.add(query));
        },
        error: (error: unknown) => this.errorMessage.set(getErrorMessage(error)),
      });
  }

  protected useRecent(query: SearchQuery): void {
    this.form.setValue(query);
    this.search();
  }
}
