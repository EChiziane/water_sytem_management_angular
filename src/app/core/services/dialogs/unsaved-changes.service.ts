import { Injectable, inject } from '@angular/core';
import { AbstractControl } from '@angular/forms';
import { NzModalService } from 'ng-zorro-antd/modal';
import { TranslationService } from '@core/services/i18n/translation.service';
import { CanDeactivateFn } from '@angular/router';
@Injectable({ providedIn: 'root' })
export class UnsavedChangesService {
  private forms = new Set<AbstractControl>();
  private pending: Promise<boolean> | null = null;
  constructor(
    private modal: NzModalService,
    private t: TranslationService,
  ) {}
  register(form: AbstractControl) {
    this.forms.add(form);
    return () => this.forms.delete(form);
  }
  get dirty() {
    return [...this.forms].some((f) => f.dirty);
  }
  confirm(): Promise<boolean> {
    if (this.pending) return this.pending;
    this.pending = new Promise<boolean>((resolve) => {
      this.modal.confirm({
        nzTitle: this.t.instant('ux.discardTitle'),
        nzContent: this.t.instant('ux.discardNote'),
        nzOkText: this.t.instant('ux.discard'),
        nzCancelText: this.t.instant('ux.keepEditing'),
        nzAutofocus: 'cancel',
        nzMaskClosable: false,
        nzOnOk: () => {
          resolve(true);
        },
        nzOnCancel: () => {
          resolve(false);
        },
      });
    }).finally(() => (this.pending = null));
    return this.pending;
  }
  discardAll() {
    this.forms.forEach((f) => f.markAsPristine());
  }
  async leave() {
    if (!this.dirty) return true;
    const approved = await this.confirm();
    if (approved) this.discardAll();
    return approved;
  }
}
export const unsavedChangesGuard: CanDeactivateFn<unknown> = () =>
  inject(UnsavedChangesService).leave();
