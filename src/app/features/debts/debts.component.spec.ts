import { DebtsComponent } from './debts.component';
import { PaymentComponent } from '../payments/payment.component';
import { MonthlyCharge } from '@shared/models/monthly-charge';
import { Payment } from '@shared/models/payment';
import { By } from '@angular/platform-browser';
import { Router, RouterLink } from '@angular/router';
import { FormControl, FormGroup } from '@angular/forms';
import { PermissionService } from '@core/auth/permission.service';
describe('Period-based debt and payment consultation', () => {
  it('preselects the customer and starts with the oldest unpaid period across years', () => {
    const c = Object.create(PaymentComponent.prototype) as PaymentComponent;
    c.paymentForm = new FormGroup({
      customerId: new FormControl(''),
      numMonths: new FormControl(1),
      amount: new FormControl(0),
    }) as any;
    (c as any).customerService = {
      getCustomerById: () =>
        of({ id: 'c1', monthlyFee: 750, unpaidMonths: ['2025-12', '2026-01'] }),
    };
    c.onCustomerSelect('c1');
    expect(c.paymentForm.value.customerId).toBe('c1');
    expect(c.selectedCustomer?.unpaidMonths).toEqual(['2025-12', '2026-01']);
    expect(c.selectedMonths).toEqual(['2025-12']);
    c.paymentForm.patchValue({ numMonths: 2 });
    c.onNumMonthsChange();
    expect(c.selectedMonths).toEqual(['2025-12', '2026-01']);
    expect(c.paymentForm.value.amount).toBe(1500);
  });
  it('filters debts by exact month across years and searches customer codes without hiding cancelled customers', () => {
    const c = new DebtsComponent(null as any, null as any, null as any, { can: () => true } as any);
    c.customers = [{ id: 'c1', name: 'Ana', code: 'C001', status: 'INATIVO' } as any];
    c.charges = [
      { customerId: 'c1', referenceMonth: '2025-12', amount: 750, customerNameSnapshot: 'Ana' },
      { customerId: 'c1', referenceMonth: '2026-01', amount: 900, customerNameSnapshot: 'Ana' },
    ] as MonthlyCharge[];
    c.year = '2025';
    c.period = '2025-12';
    c.search = 'c001';
    expect(c.rows.length).toBe(1);
    expect(c.total).toBe(750);
    expect(c.rows[0].customer?.status).toBe('INATIVO');
    c.year = '2026';
    c.period = '2026-01';
    expect(c.total).toBe(900);
  });
  it('distinguishes receipt month in Maputo from multiple settled periods across December/January', () => {
    const c = Object.create(PaymentComponent.prototype) as PaymentComponent;
    c.dataSource = [
      {
        paymentDate: '2025-12-31T23:00:00Z',
        referenceMonth: '2025-12 | 2026-01',
        customerName: 'Ana',
        referenceCode: 'P1',
      } as Payment,
    ];
    c.searchValue = '';
    c.periodMode = 'received';
    c.selectedYear = '2026';
    c.selectedPeriod = '2026-01';
    c.filterData();
    expect(c.listOfDisplayData.length).toBe(1);
    expect(c.availablePeriods).toEqual(['2026-01']);
    c.selectedYear = '2025';
    c.selectedPeriod = '2025-12';
    c.filterData();
    expect(c.listOfDisplayData.length).toBe(0);
    c.periodMode = 'settled';
    c.filterData();
    expect(c.listOfDisplayData.length).toBe(1);
    expect(c.availablePeriods).toEqual(['2026-01', '2025-12']);
  });
});

import { TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { BillingService } from '@core/services/billing/billing.service';
import { CustomerService } from '@core/services/customers/customer.service';
import { TranslationService } from '@core/services/i18n/translation.service';
import { IconsProviderModule } from '@core/icons/icons-provider.module';
describe('Debt page rendering', () => {
  it('stabilizes with the actual table and responds to a period change', async () => {
    await TestBed.configureTestingModule({
      imports: [DebtsComponent, NoopAnimationsModule, IconsProviderModule],
      providers: [
        provideRouter([]),
        { provide: PermissionService, useValue: { can: () => true } },
        {
          provide: BillingService,
          useValue: {
            getAllBilling: () =>
              of([
                {
                  id: 'a',
                  customerId: 'c1',
                  referenceMonth: '2025-12',
                  paid: false,
                  amount: 750,
                  customerNameSnapshot: 'Ana',
                },
                {
                  id: 'b',
                  customerId: 'c1',
                  referenceMonth: '2026-01',
                  paid: false,
                  amount: 900,
                  customerNameSnapshot: 'Ana',
                },
              ]),
          },
        },
        {
          provide: CustomerService,
          useValue: { getCustomers: () => of([{ id: 'c1', name: 'Ana', code: 'C001' }]) },
        },
        {
          provide: TranslationService,
          useValue: { currentLanguage: 'pt', instant: (key: string) => key },
        },
      ],
    }).compileComponents();
    const fixture = TestBed.createComponent(DebtsComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    const c = fixture.componentInstance;
    expect(fixture.nativeElement.textContent).toContain('Ana');
    const initialRows = c.rows;
    expect(c.rows).toBe(initialRows);
    expect(c.periods).toBe(c.periods);
    c.year = '2025';
    c.period = '2025-12';
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    expect(c.rows[0].charge.referenceMonth).toBe('2025-12');
    expect(c.total).toBe(750);
    const payLink = fixture.debugElement.query(By.css('.row-action-pay')).injector.get(RouterLink);
    expect(TestBed.inject(Router).serializeUrl(payLink.urlTree!)).toBe(
      '/app/payment?customerId=c1',
    );
    expect(c.rows).not.toBe(initialRows);
    fixture.destroy();
  });
});
