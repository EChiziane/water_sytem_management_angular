import { assert } from '../shared/errors.mjs';
import { requirePermission } from '../security/permissions.mjs';
import { id, cents, audit } from './common.mjs';
import { refreshDebt, calendar } from './billing.mjs';

export function createPayment(state, payload, actor, now = new Date()) {
  requirePermission(actor, 'payments.create');
  const c = state.customers.find((c) => c.id === payload.customerId);
  assert(c, 'Cliente não encontrado.', 404);
  assert(['ATIVO', 'ACTIVE'].includes(c.status), 'Cliente inativo.');
  const count = payload.numMonths;
  assert(Number.isInteger(count) && count > 0, 'Número de meses inválido.');
  assert(
    ['CASH', 'MPESA', 'EMOLA', 'BCI', 'BIM'].includes(payload.paymentMethod),
    'Método de pagamento inválido.',
  );
  refreshDebt(state, now);
  const months = state.charges
    .filter((x) => x.customerId === c.id && !x.paid)
    .sort((a, b) => a.referenceMonth.localeCompare(b.referenceMonth));
  assert(
    count <= months.length,
    'Adiantamentos não disponíveis: selecione apenas mensalidades existentes.',
  );
  const selected = months.slice(0, count),
    expected = selected.reduce((total, m) => total + cents(m.amount), 0);
  assert(Number.isSafeInteger(expected), 'O montante excede o limite suportado.');
  assert(
    cents(payload.amount) === expected && expected > 0,
    'O valor recebido deve corresponder exatamente às mensalidades mais antigas.',
  );
  assert(!payload.tax || payload.tax === 0, 'Impostos adicionais não estão definidos.');
  const year = calendar(now).month.slice(0, 4);
  let sequence = Number(state.sequences?.[year] || 0),
    referenceCode;
  do {
    sequence++;
    referenceCode = `REC-${year}-${String(sequence).padStart(6, '0')}`;
  } while (state.payments.some((p) => p.referenceCode === referenceCode));
  state.sequences = { ...state.sequences, [year]: sequence };
  const payment = {
    id: id(),
    referenceCode,
    customerId: c.id,
    customerName: c.name,
    customerContact: c.contact,
    customerAddress: c.address,
    customerValve: c.valve,
    monthlyFee: c.monthlyFee,
    amount: expected / 100,
    tax: 0,
    unitPrice: selected[0].amount,
    confirmed: true,
    referenceMonth: selected.map((m) => m.referenceMonth).join('|'),
    numMonths: count,
    periodAmounts: Object.fromEntries(selected.map((m) => [m.referenceMonth, m.amount])),
    paymentDate: now.toISOString(),
    paymentMethod: payload.paymentMethod,
    createdBy: actor.id,
    createdByName: actor.name,
  };
  state.payments.unshift(payment);
  for (const month of selected)
    Object.assign(month, {
      paid: true,
      paidAt: payment.paymentDate,
      paymentId: payment.id,
      paymentReferenceCode: referenceCode,
      paymentMethod: payment.paymentMethod,
      paymentDate: payment.paymentDate,
      createdByName: actor.name,
    });
  state.receipts.unshift(receiptFor(payment));
  refreshDebt(state, now);
  audit(state, actor, 'payment.created', payment.id, now);
  return payment;
}

export function receiptFor(p) {
  return {
    id: id(),
    invoiceCode: p.referenceCode,
    paymentId: p.id,
    customerName: p.customerName,
    fileName: `RECIBO_${p.referenceCode}.pdf`,
    filePath: '',
    total: `${p.amount.toFixed(2)} MT`,
    monthDescription: p.referenceMonth,
    createdAt: p.paymentDate,
  };
}

export function safeReceipt(r, state) {
  return { ...r, payment: state.payments.find((p) => p.id === r.paymentId) };
}
