import { Injectable } from '@angular/core';
import { NzMessageService } from 'ng-zorro-antd/message';
import { TranslationService } from '@core/services/i18n/translation.service';
@Injectable({ providedIn: 'root' })
export class OperationFeedbackService {
  constructor(
    private messages: NzMessageService,
    private t: TranslationService,
  ) {}
  error(error: any, fallback: string) {
    this.messages.error(
      error?.status === 507 ||
        error?.name === 'QuotaExceededError' ||
        error?.name === 'SecurityError'
        ? this.t.instant('ux.storageFull')
        : fallback,
    );
  }
}
