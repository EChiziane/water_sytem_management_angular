import {Customer} from '@shared/models/WSM/customer';
import {Payment} from '@shared/models/WSM/payment';
import {maputoMonthKey} from './business-date';

const monthPattern = /^\d{4}-(0[1-9]|1[0-2])$/;
export function isOverdueMonth(month: string, now = new Date()): boolean {
  if (!monthPattern.test(month)) return false;
  const current = maputoMonthKey(now);
  const day = Number(new Intl.DateTimeFormat('en-GB', {timeZone: 'Africa/Maputo', day: 'numeric'}).format(now));
  return month < current || (month === current && day >= 11);
}

/** Demo-only recovery. Production obligations are created by the backend. */
export function recoverLocalBilling(customers: Customer[], payments: Payment[], now = new Date()): Customer[] {
  const current = maputoMonthKey(now);
  return customers.map(customer => {
    const records = payments.filter(payment => payment.customerId === customer.id);
    const references = (payment: Payment) => (payment.referenceMonth || '').split('|').map(month => month.trim()).filter(month => monthPattern.test(month));
    const paid = new Set(records.filter(payment => payment.confirmed).flatMap(references));
    const unpaid = new Set((customer.unpaidMonths || []).filter(month => monthPattern.test(month) && !paid.has(month)));
    const known = [...unpaid, ...records.flatMap(references)].sort();
    const active = ['ATIVO', 'ACTIVE'].includes((customer.status || '').toUpperCase());
    // Never infer installation or the first charge from the registration date.
    if (active && known.length) {
      let cursor = known[0];
      while (cursor <= current) {
        if (!paid.has(cursor)) unpaid.add(cursor);
        const [year, month] = cursor.split('-').map(Number);
        cursor = month === 12 ? `${year + 1}-01` : `${year}-${String(month + 1).padStart(2, '0')}`;
      }
    }
    const unpaidMonths = [...unpaid].sort();
    return {...customer, unpaidMonths, monthsInDebt: unpaidMonths.filter(month => isOverdueMonth(month, now)).length};
  });
}
