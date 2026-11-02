import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environments';

export type BackupAction = 'snapshot' | 'spring' | 'test-source';
export interface BackupInfo {
  name: string;
  size: number;
  createdAt?: string;
}
export interface BackupStatus {
  lastSpringBackup?: { at: string } | null;
}

/** HTTP contract for private backups. Local import/export remains in the demo data adapter. */
@Injectable({ providedIn: 'root' })
export class BackupService {
  private readonly url = environment.baseURL + '/backups';
  constructor(private http: HttpClient) {}
  getStatus() {
    return this.http.get<BackupStatus>(this.url + '/status');
  }
  exportData() {
    return this.http.get<unknown>(this.url + '/export');
  }
  execute(action: BackupAction) {
    return this.http.post<unknown>(this.url + '/' + action, { confirm: true });
  }
  list() {
    return this.http.get<BackupInfo[]>(this.url);
  }
  download(name: string) {
    return this.http.get<unknown>(this.url + '/file/' + encodeURIComponent(name));
  }
}
