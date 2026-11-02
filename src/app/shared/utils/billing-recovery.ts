import { Customer } from '@shared/models/customer';
import { Payment } from '@shared/models/payment';
import { maputoMonthKey } from './business-date';
import { isBillingPeriod, nextBillingPeriod, paymentPeriods } from './billing-period';

export function isOverdueMonth(month: string, now = new Date()): boolean {
  if (!isBillingPeriod(month)) return false;
  const current = maputoMonthKey(now);
  const day = Number(
    new Intl.DateTimeFormat('en-GB', { timeZone: 'Africa/Maputo', day: 'numeric' }).format(now),
  );
  return month < current || (month === current && day >= 11);
}

/** Demo-only recovery. Production obligations are created by the backend. */
export function recoverLocalBilling(
  customers: Customer[],
  payments: Payment[],
  now = new Date(),
): Customer[] {
  const current = maputoMonthKey(now);
  return customers.map((customer) => {
    // Leave unsupported legacy state untouched; never erase it during automatic recovery.
    if ((customer.unpaidMonths || []).some((month) => !isBillingPeriod(month)))
      return { ...customer };
    const records = payments.filter((payment) => payment.customerId === customer.id);
    const references = (payment: Payment) => paymentPeriods(payment.referenceMonth);
    const paid = new Set(records.filter((payment) => payment.confirmed).flatMap(references));
    const unpaid = new Set(
      (customer.unpaidMonths || []).filter((month) => isBillingPeriod(month) && !paid.has(month)),
    );
    const known = [...unpaid, ...records.flatMap(references)].sort();
    const active = ['ATIVO', 'ACTIVE'].includes((customer.status || '').toUpperCase());
    // Never infer installation or the first charge from the registration date.
    if (active && known.length && isBillingPeriod(current)) {
      let cursor = known[0];
      while (cursor <= current) {
        if (!paid.has(cursor)) unpaid.add(cursor);
        if (cursor === current) break;
        cursor = nextBillingPeriod(cursor);
      }
    }
    const unpaidMonths = [...unpaid].sort();
    return {
      ...customer,
      unpaidMonths,
      monthsInDebt: unpaidMonths.filter((month) => isOverdueMonth(month, now)).length,
    };
  });
}
