import { assert } from '../shared/errors.mjs';
import { id } from './common.mjs';

export function period(value) {
  return typeof value === 'string' && /^(20(?:1[2-9]|[2-9]\d))-(0[1-9]|1[0-2])$/.test(value);
}

export function nextPeriod(value) {
  assert(period(value), 'Período inválido.');
  const [y, m] = value.split('-').map(Number);
  const next = m === 12 ? `${y + 1}-01` : `${y}-${String(m + 1).padStart(2, '0')}`;
  assert(period(next), 'Período fora de 2012–2099.');
  return next;
}

export function calendar(now = new Date()) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Africa/Maputo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(now);
  const value = (type) => parts.find((p) => p.type === type).value;
  return { month: `${value('year')}-${value('month')}`, day: Number(value('day')) };
}

export function refreshDebt(state, now = new Date()) {
  const today = calendar(now);
  if (!period(today.month)) return;
  for (const c of state.customers) {
    const charges = state.charges.filter((x) => x.customerId === c.id);
    const known = charges.map((x) => x.referenceMonth).sort();
    if (['ACTIVE', 'ATIVO'].includes(c.status) && known.length) {
      const keys = new Set(known);
      let cursor = known[0];
      while (cursor <= today.month) {
        if (!keys.has(cursor)) {
          state.charges.push(chargeFor(c, cursor));
          keys.add(cursor);
        }
        if (cursor === today.month) break;
        cursor = nextPeriod(cursor);
      }
    }
    c.unpaidMonths = state.charges
      .filter((x) => x.customerId === c.id && !x.paid)
      .map((x) => x.referenceMonth)
      .sort();
    c.monthsInDebt = c.unpaidMonths.filter(
      (m) => m < today.month || (m === today.month && today.day >= 11),
    ).length;
  }
}

export function chargeFor(c, month) {
  return {
    id: id(),
    customerId: c.id,
    referenceMonth: month,
    amount: c.monthlyFee,
    paid: false,
    paidAt: '',
    paymentId: '',
    customerNameSnapshot: c.name,
    customerContactSnapshot: c.contact,
    customerAddressSnapshot: c.address,
    valveSnapshot: String(c.valve),
    customerStatusSnapshot: c.status,
    paymentReferenceCode: '',
    paymentMethod: '',
    createdByName: '',
    paymentDate: '',
  };
}
