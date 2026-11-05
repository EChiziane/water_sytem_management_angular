import { Component, EventEmitter, Output } from '@angular/core';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { TranslationService } from '@core/services/i18n/translation.service';
@Component({
  selector: 'app-request-state',
  standalone: true,
  imports: [NzButtonModule],
  template: `<section class="wsm-request-error" role="alert">
    <div>
      <strong>{{ t.instant('ux.loadFailed') }}</strong>
      <p>{{ t.instant('ux.loadFailedNote') }}</p>
    </div>
    <button nz-button type="button" (click)="retry.emit()">{{ t.instant('ux.retry') }}</button>
  </section>`,
})
export class RequestStateComponent {
  @Output() retry = new EventEmitter<void>();
  constructor(public t: TranslationService) {}
}
