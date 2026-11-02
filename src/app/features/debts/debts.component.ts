import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { forkJoin, finalize } from 'rxjs';
import { BillingService } from '@core/services/billing/billing.service';
import { CustomerService } from '@core/services/customers/customer.service';
import { TranslationService } from '@core/services/i18n/translation.service';
import { Customer } from '@shared/models/customer';
import { MonthlyCharge } from '@shared/models/monthly-charge';
import { PeriodFilterComponent } from '@shared/components/period-filter/period-filter.component';
import { RowActionComponent } from '@shared/components/row-action/row-action.component';
import { isBillingPeriod } from '@shared/utils/billing-period';
import { maputoMonthKey } from '@shared/utils/business-date';
import { StatusBadgeComponent } from '@shared/components/status-badge/status-badge.component';
import { money } from '@shared/utils/payment-presentation';
@Component({
  selector: 'app-debts',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    NzTableModule,
    NzButtonModule,
    PeriodFilterComponent,
    RowActionComponent,
    StatusBadgeComponent,
  ],
  templateUrl: './debts.component.html',
  styleUrls: ['./debts.component.scss'],
})
export class DebtsComponent implements OnInit {
  charges: MonthlyCharge[] = [];
  customers: Customer[] = [];
  period = '';
  year = '';
  search = '';
  loading = false;
  failed = false;
  readonly today = new Date();
  readonly current = maputoMonthKey(this.today);
  money = money;
  constructor(
    private billing: BillingService,
    private customerService: CustomerService,
    public t: TranslationService,
  ) {}
  ngOnInit() {
    this.load();
  }
  load() {
    this.loading = true;
    this.failed = false;
    forkJoin({
      charges: this.billing.getAllBilling(),
      customers: this.customerService.getCustomers(),
    })
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: ({ charges, customers }) => {
          this.charges = charges.filter(
            (c) => !c.paid && isBillingPeriod(c.referenceMonth) && c.referenceMonth <= this.current,
          );
          this.customers = customers;
          const periods = this.periods;
          this.period = periods.includes(this.current) ? this.current : periods[0] || '';
          this.year = this.period.slice(0, 4);
        },
        error: () => {
          this.failed = true;
          this.charges = [];
        },
      });
  }
  private periodSource?: MonthlyCharge[];
  private cachedPeriods: string[] = [];
  get periods() {
    if (this.periodSource !== this.charges) {
      this.periodSource = this.charges;
      this.cachedPeriods = [...new Set(this.charges.map((c) => c.referenceMonth))].sort().reverse();
    }
    return this.cachedPeriods;
  }
  private rowSource?: MonthlyCharge[];
  private customerSource?: Customer[];
  private filterKey = '';
  private cachedRows: { charge: MonthlyCharge; customer: Customer | undefined }[] = [];
  get rows() {
    const key = JSON.stringify([this.period, this.year, this.search]);
    if (
      this.rowSource === this.charges &&
      this.customerSource === this.customers &&
      this.filterKey === key
    )
      return this.cachedRows;
    this.rowSource = this.charges;
    this.customerSource = this.customers;
    this.filterKey = key;
    this.cachedRows = this.charges
      .map((charge) => ({
        charge,
        customer: this.customers.find((c) => c.id === charge.customerId),
      }))
      .filter(
        ({ charge, customer }) =>
          (!this.period || charge.referenceMonth === this.period) &&
          (!this.year || charge.referenceMonth.startsWith(this.year + '-')) &&
          [
            customer?.name,
            customer?.code,
            charge.customerNameSnapshot,
            charge.customerContactSnapshot,
          ].some((v) => (v || '').toLowerCase().includes(this.search.toLowerCase().trim())),
      )
      .sort(
        (a, b) =>
          b.charge.referenceMonth.localeCompare(a.charge.referenceMonth) ||
          a.charge.customerNameSnapshot.localeCompare(b.charge.customerNameSnapshot),
      );
    return this.cachedRows;
  }
  get total() {
    return this.rows.reduce((n, r) => n + Math.round(r.charge.amount * 100), 0) / 100;
  }
  label(period: string) {
    return new Intl.DateTimeFormat(this.t.currentLanguage, {
      month: 'long',
      year: 'numeric',
      timeZone: 'Africa/Maputo',
    }).format(new Date(period + '-01T12:00:00+02:00'));
  }
}
