import { DebtsComponent } from './debts.component';
import { PaymentComponent } from '../payments/payment.component';
import { MonthlyCharge } from '@shared/models/monthly-charge';
import { Payment } from '@shared/models/payment';
describe('Period-based debt and payment consultation', () => {
  it('filters debts by exact month across years and searches customer codes without hiding cancelled customers', () => {
    const c = new DebtsComponent(null as any, null as any, null as any);
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
