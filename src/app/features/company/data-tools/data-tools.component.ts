import { BusinessDatePipe } from '@shared/pipes/business-date.pipe';
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BackupService, BackupAction, BackupInfo } from '@core/services/backups/backup.service';
import { Router } from '@angular/router';
import { defer, of, tap, finalize } from 'rxjs';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { environment } from '../../../../environments/environments';
import { AuthSessionService } from '@core/auth/auth-session.service';
import { PermissionService } from '@core/auth/permission.service';
import { WaterLocalDataService } from '@core/data/demo/water-local-data.service';
import { OperationConfirmationService } from '@core/services/dialogs/operation-confirmation.service';
import { TranslationService } from '@core/services/i18n/translation.service';

@Component({
  selector: 'app-data-tools',
  standalone: true,
  imports: [BusinessDatePipe, CommonModule, NzButtonModule, NzIconModule],
  templateUrl: './data-tools.component.html',
  styleUrl: './data-tools.component.scss',
})
export class DataToolsComponent implements OnInit {
  readonly local = !environment.production && environment.dataMode === 'local';
  busy = false;
  notice = '';
  error = '';
  lastSpringBackup = '';
  backups: BackupInfo[] = [];
  constructor(
    public permissions: PermissionService,
    private backupsApi: BackupService,
    private data: WaterLocalDataService,
    private confirmations: OperationConfirmationService,
    private translations: TranslationService,
    private session: AuthSessionService,
    private router: Router,
  ) {}
  ngOnInit() {
    if (!this.local && this.permissions.can('users.manage'))
      this.backupsApi.getStatus().subscribe({
        next: (s) => (this.lastSpringBackup = s.lastSpringBackup?.at || ''),
        error: (e) => (this.error = e.error?.message || this.text('failed')),
      });
  }
  text(key: string) {
    return this.translations.instant('dataTools.' + key);
  }
  private download(value: unknown, name: string) {
    const text = typeof value === 'string' ? value : JSON.stringify(value, null, 2);
    const url = URL.createObjectURL(new Blob([text], { type: 'application/json' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = name;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 10000);
  }
  exportOriginal() {
    try {
      this.download(this.data.exportRawBackup(), `water-original-${Date.now()}.txt`);
    } catch {
      this.error = this.text('failed');
    }
  }
  exportData() {
    if (this.local) {
      try {
        this.download(this.data.exportState('txt'), `water-backup-${Date.now()}.txt`);
      } catch {
        this.error = this.text('corrupt');
      }
      return;
    }
    this.busy = true;
    this.backupsApi
      .exportData()
      .pipe(finalize(() => (this.busy = false)))
      .subscribe({
        next: (value) => this.download(value, `water-backup-${Date.now()}.txt`),
        error: (e) => (this.error = e.error?.message || this.text('failed')),
      });
  }
  async selectFile(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;
    if (file.size > 3_000_000) {
      this.error = this.text('invalid');
      return;
    }
    try {
      const raw = await file.text();
      const parsed = JSON.parse(raw),
        state = parsed.state;
      if (
        !state ||
        !['customers', 'payments', 'receipts', 'users'].every((k) => Array.isArray(state[k]))
      )
        throw new Error();
      this.confirmations.run(
        {
          key: 'restore-local-data',
          title: this.text('importTitle'),
          description: this.text('importNote'),
          fields: [
            [this.text('customers'), String(state.customers.length)],
            [this.text('payments'), String(state.payments.length)],
            [this.text('receipts'), String(state.receipts.length)],
          ],
          confirmLabel: this.text('importConfirm'),
          danger: true,
        },
        () =>
          defer(() => {
            this.data.restoreBackup(raw);
            this.session.clear();
            this.router.navigate(['/login']);
            return of(true);
          }).pipe(tap({ error: () => (this.error = this.text('invalid')) })),
      );
    } catch {
      this.error = this.text('invalid');
    }
  }
  cloudAction(action: BackupAction) {
    this.confirmations.run(
      {
        key: 'backup-' + action,
        title: this.text(action),
        description: this.text(action + 'Note'),
        fields: [],
        confirmLabel: this.text('confirm'),
      },
      () => {
        this.busy = true;
        this.notice = '';
        this.error = '';
        return this.backupsApi.execute(action).pipe(
          finalize(() => (this.busy = false)),
          tap({
            next: (value) => {
              this.notice = this.text('done');
              if (action === 'spring') this.ngOnInit();
              if (action === 'test-source') this.download(value, `water-test-${Date.now()}.txt`);
            },
            error: (e) => (this.error = e.error?.message || this.text('failed')),
          }),
        );
      },
    );
  }
  loadBackups() {
    this.busy = true;
    this.backupsApi
      .list()
      .pipe(finalize(() => (this.busy = false)))
      .subscribe({
        next: (value) => (this.backups = value),
        error: (e) => (this.error = e.error?.message || this.text('failed')),
      });
  }
  downloadBackup(name: string) {
    this.busy = true;
    this.backupsApi
      .download(name)
      .pipe(finalize(() => (this.busy = false)))
      .subscribe({
        next: (value) => this.download(value, name),
        error: (e) => (this.error = e.error?.message || this.text('failed')),
      });
  }
}
