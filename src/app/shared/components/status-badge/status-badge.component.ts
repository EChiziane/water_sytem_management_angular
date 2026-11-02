import { Component, Input } from '@angular/core';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzTooltipDirective } from 'ng-zorro-antd/tooltip';
import { TranslationService } from '@core/services/i18n/translation.service';
import { describeStatus, StatusKind } from '@shared/utils/status-presentation';

@Component({
  selector: 'app-status-badge',
  standalone: true,
  imports: [NzIconModule, NzTooltipDirective],
  template: ` <span
    class="status-badge"
    [attr.data-tone]="state.tone"
    role="img"
    [attr.aria-label]="label + '. ' + hint"
    nz-tooltip
    [nzTooltipTitle]="hint"
  >
    <nz-icon [nzType]="state.icon" aria-hidden="true"></nz-icon><span>{{ label }}</span>
  </span>`,
  styleUrl: './status-badge.component.scss',
})
export class StatusBadgeComponent {
  @Input() kind: StatusKind = 'customer';
  @Input() value: unknown;
  @Input() period?: string | null;
  @Input() showCount = false;
  constructor(private translations: TranslationService) {}
  get state() {
    return describeStatus(this.kind, this.value, this.period);
  }
  get label() {
    const label = this.translations.instant(this.state.label);
    if (this.kind === 'debt' && this.showCount && this.state.label === 'statuses.overdue.label') {
      const count = Number(this.value);
      return `${label} · ${count} ${this.translations.instant(count === 1 ? 'statuses.debtMonth' : 'statuses.debtMonths')}`;
    }
    return label;
  }
  get hint() {
    return this.translations.instant(this.state.hint);
  }
}
