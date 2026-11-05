import { formatMonthLabel } from '@shared/utils/month-label';
import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslationService } from '@core/services/i18n/translation.service';
import { isBillingPeriod } from '@shared/utils/billing-period';
@Component({
  selector: 'app-period-filter',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `<label
      >{{ t.instant('periods.year') }}
      <select [ngModel]="year" (ngModelChange)="changeYear($event)">
        <option value="">{{ t.instant('periods.allYears') }}</option>
        <option *ngFor="let y of years" [value]="y">{{ y }}</option>
      </select></label
    ><label
      >{{ t.instant('periods.month') }}
      <select [ngModel]="value" (ngModelChange)="valueChange.emit($event)">
        <option value="">{{ t.instant('periods.allMonths') }}</option>
        <option *ngFor="let p of months" [value]="p">{{ monthLabel(p) }}</option>
      </select></label
    >`,
  styles: [
    `
      :host {
        display: flex;
        gap: 12px;
        flex-wrap: wrap;
      }
      label {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 12px;
        color: #526278;
      }
      select {
        height: 32px;
        padding: 0 8px;
        border: 1px solid #dce3eb;
        border-radius: 6px;
        background: #fff;
        color: #233148;
        font: inherit;
        min-width: 110px;
      }
    `,
  ],
})
export class PeriodFilterComponent {
  @Input() periods: string[] = [];
  @Input() value = '';
  @Input() year = '';
  @Output() valueChange = new EventEmitter<string>();
  @Output() yearChange = new EventEmitter<string>();
  constructor(public t: TranslationService) {}
  get valid() {
    return [...new Set(this.periods.filter(isBillingPeriod))].sort().reverse();
  }
  get years() {
    return [...new Set(this.valid.map((p) => p.slice(0, 4)))];
  }
  get months() {
    return this.valid.filter((p) => !this.year || p.startsWith(this.year + '-'));
  }
  changeYear(year: string) {
    this.yearChange.emit(year);
    this.valueChange.emit('');
  }
  monthLabel(period: string) {
    return formatMonthLabel(period, this.t.currentLanguage);
  }
}
