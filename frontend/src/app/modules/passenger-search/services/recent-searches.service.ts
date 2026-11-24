import { Injectable, inject } from '@angular/core';
import { StorageService } from '../../../core/services/storage.service';
import { SearchQuery } from '../models/route-match.model';

const RECENT_KEY = 'safariflow.recentSearches';
const MAX_RECENT = 5;

@Injectable({ providedIn: 'root' })
export class RecentSearchesService {
  private readonly storage = inject(StorageService);

  list(): SearchQuery[] {
    try {
      const stored: unknown = JSON.parse(this.storage.get(RECENT_KEY) ?? '[]');
      return Array.isArray(stored) ? (stored as SearchQuery[]).slice(0, MAX_RECENT) : [];
    } catch {
      return [];
    }
  }

  /** Puts the search first, drops a repeat of it, and returns the new list. */
  add(query: SearchQuery): SearchQuery[] {
    const others = this.list().filter((item) => item.from !== query.from || item.to !== query.to);
    const recent = [query, ...others].slice(0, MAX_RECENT);
    this.storage.set(RECENT_KEY, JSON.stringify(recent));
    return recent;
  }
}
