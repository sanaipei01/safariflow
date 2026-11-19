import { Injectable } from '@angular/core';

/** Thin wrapper around localStorage that never throws (private mode, blocked storage). */
@Injectable({ providedIn: 'root' })
export class StorageService {
  get(key: string): string | null {
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  }

  set(key: string, value: string): void {
    try {
      localStorage.setItem(key, value);
    } catch {
      // storage unavailable: the user simply has to log in again next time
    }
  }

  remove(key: string): void {
    try {
      localStorage.removeItem(key);
    } catch {
      // nothing to clean up
    }
  }
}
