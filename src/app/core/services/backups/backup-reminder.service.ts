import { Injectable } from '@angular/core';
import { environment } from '../../../../environments/environments';
@Injectable({ providedIn: 'root' })
export class BackupReminderService {
  private key = environment.waterStorageKey + '-last-export-request';
  get lastExport(): string {
    try {
      return localStorage.getItem(this.key) || '';
    } catch {
      return '';
    }
  }
  recordExport() {
    try {
      localStorage.setItem(this.key, new Date().toISOString());
    } catch {
      /* The file request succeeded; tracking is optional. */
    }
  }
  get needsExport(): boolean {
    const at = Date.parse(this.lastExport);
    if (!Number.isFinite(at) || Date.now() - at > 7 * 86400000) return true;
    try {
      const state = JSON.parse(localStorage.getItem(environment.waterStorageKey) || '{}');
      const company = JSON.parse(
        localStorage.getItem(environment.waterStorageKey + '-company') || '{}',
      );
      return [state.savedAt, company.updatedAt].some((v) => Date.parse(v) > at);
    } catch {
      return true;
    }
  }
}
