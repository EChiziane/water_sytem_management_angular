import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BUSINESS_YEARS } from '@shared/utils/billing-period';
import { TranslationService } from '@core/services/i18n/translation.service';

@Component({
  selector: 'app-year-filter',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: ` <label
    ><span>{{ translations.instant(label) }}</span
    ><select [ngModel]="value" (ngModelChange)="valueChange.emit($event)">
      <option [ngValue]="null">{{ translations.instant('years.all') }}</option>
      <option *ngFor="let year of years" [ngValue]="year">{{ year }}</option>
    </select></label
  >`,
  styles: [
    `
      :host {
        display: inline-flex;
        flex: 0 0 auto;
      }
      label {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        font-size: 12px;
        color: #526278;
      }
      select {
        height: 32px;
        min-width: 105px;
        padding: 0 8px;
        border: 1px solid #dce3eb;
        border-radius: 6px;
        background: #fff;
        color: #233148;
        font: inherit;
      }
      select:focus-visible {
        outline: 2px solid #2474c5;
        outline-offset: 2px;
      }
    `,
  ],
})
export class YearFilterComponent {
  @Input() value: number | null = null;
  @Input() label = 'years.year';
  @Output() valueChange = new EventEmitter<number | null>();
  readonly years = BUSINESS_YEARS;
  constructor(public translations: TranslationService) {}
}
