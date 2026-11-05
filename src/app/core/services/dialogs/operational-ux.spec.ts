import { FormControl, FormGroup } from '@angular/forms';
import { UnsavedChangesService } from './unsaved-changes.service';
import { ListViewStateService } from './list-view-state.service';
import { writeBrowserData } from '@shared/utils/browser-storage';
import { formatMonthLabel } from '@shared/utils/month-label';
import { BackupReminderService } from '../backups/backup-reminder.service';
import { environment } from '../../../../environments/environments';

describe('Operational UX safeguards', () => {
  it('keeps edits when leaving is cancelled and marks pristine only after confirmation', async () => {
    let options: any;
    const modal = {
      confirm: (o: any) => {
        options = o;
      },
    };
    const service = new UnsavedChangesService(
      modal as any,
      { instant: (key: string) => key } as any,
    );
    const form = new FormGroup({ name: new FormControl('Ana') });
    const dispose = service.register(form);
    form.markAsDirty();
    const first = service.leave();
    options.nzOnCancel();
    expect(await first).toBeFalse();
    expect(form.dirty).toBeTrue();
    const second = service.leave();
    options.nzOnOk();
    expect(await second).toBeTrue();
    expect(form.pristine).toBeTrue();
    form.markAsDirty();
    dispose();
    expect(service.dirty).toBeFalse();
  });
  it('reports quota failure instead of returning success', () => {
    spyOn(Storage.prototype, 'setItem').and.throwError(
      new DOMException('Full', 'QuotaExceededError'),
    );
    expect(() => writeBrowserData('wsm-ux-test', 'new')).toThrow();
    try {
      writeBrowserData('wsm-ux-test', 'new');
    } catch (error: any) {
      expect(error.status).toBe(507);
      expect(error.error.code).toBe('BROWSER_STORAGE_UNAVAILABLE');
    }
  });
  it('keeps list navigation state per account and does not share object mutations', () => {
    let user = 'a';
    const views = new ListViewStateService({ getUser: () => ({ id: user }) } as any);
    views.save('payments', { searchValue: 'Ana', selectedYear: '2025', pageIndex: 2 });
    expect(views.read('payments')['pageIndex']).toBe(2);
    user = 'b';
    expect(views.read('payments')).toEqual({});
    user = 'a';
    const copy = views.read('payments');
    copy['pageIndex'] = 7;
    expect(views.read('payments')['pageIndex']).toBe(2);
  });
  it('uses an initial capital for all month labels in Portuguese and English without changing the period', () => {
    for (const lang of ['pt-MZ', 'en'])
      for (let month = 1; month <= 12; month++) {
        const period = '2026-' + String(month).padStart(2, '0');
        const label = formatMonthLabel(period, lang);
        expect(label[0]).toBe(label[0].toLocaleUpperCase(lang));
        expect(label).toContain('2026');
        expect(period).toMatch(/^2026-\d{2}$/);
      }
    expect(formatMonthLabel('2026-11')).toContain('Novembro');
    expect(formatMonthLabel('invalid')).toBe('invalid');
  });
  it('reminds after newer changes without claiming the downloaded file was verified', () => {
    const stamp = new Date().toISOString();
    let savedAt = new Date(Date.now() - 1000).toISOString();
    spyOn(Storage.prototype, 'getItem').and.callFake((key) =>
      key.endsWith('-last-export-request')
        ? stamp
        : key === environment.waterStorageKey
          ? JSON.stringify({ savedAt })
          : null,
    );
    const reminder = new BackupReminderService();
    expect(reminder.needsExport).toBeFalse();
    savedAt = new Date(Date.now() + 1000).toISOString();
    expect(reminder.needsExport).toBeTrue();
  });
});
