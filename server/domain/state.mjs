import { assert } from '../shared/errors.mjs';
import { PERMISSIONS } from '../security/permissions.mjs';
import { cents } from './common.mjs';
import { period } from './billing.mjs';

export function validateState(state) {
  assert(
    state &&
      state.schemaVersion === 1 &&
      Number.isSafeInteger(state.revision) &&
      state.revision >= 0,
    'Formato ou versão de dados inválidos.',
  );
  for (const name of [
    'customers',
    'payments',
    'receipts',
    'users',
    'charges',
    'audit',
    'requests',
  ]) {
    assert(Array.isArray(state[name]), `Coleção ${name} inválida.`);
    if (name !== 'requests') {
      const ids = state[name].map((x) => x?.id);
      assert(
        ids.every((x) => typeof x === 'string' && x.length > 0) && new Set(ids).size === ids.length,
        `Identificadores inválidos/duplicados em ${name}.`,
      );
    }
  }
  assert(
    !state.sequences ||
      (typeof state.sequences === 'object' &&
        !Array.isArray(state.sequences) &&
        Object.values(state.sequences).every((n) => Number.isSafeInteger(n) && n >= 0)),
    'Contadores inválidos.',
  );
  const customers = new Set(state.customers.map((c) => c.id)),
    users = new Set(state.users.map((u) => u.id)),
    payments = new Set(state.payments.map((p) => p.id));
  assert(
    state.users.some((u) => u.role === 'ADMIN' && u.status === 'ACTIVE'),
    'É necessário um administrador ativo.',
  );
  for (const u of state.users)
    assert(
      !('password' in u) &&
        PERMISSIONS[u.role] &&
        ['ACTIVE', 'INACTIVE', 'CREATED'].includes(u.status) &&
        typeof u.login === 'string' &&
        /^scrypt:[a-f0-9]{32}:[a-f0-9]{128}$/.test(u.passwordHash || ''),
      'Utilizador inválido ou sem credencial protegida.',
    );
  assert(
    new Set(state.users.map((u) => u.login.toLowerCase())).size === state.users.length,
    'Logins duplicados.',
  );
  for (const c of state.customers) {
    cents(c.monthlyFee);
    assert(
      Array.isArray(c.unpaidMonths) && c.unpaidMonths.every(period),
      'Períodos do cliente inválidos.',
    );
  }
  const allocations = new Set();
  for (const charge of state.charges) {
    assert(
      customers.has(charge.customerId) && period(charge.referenceMonth),
      'Mensalidade sem cliente/período válido.',
    );
    cents(charge.amount);
    const key = `${charge.customerId}/${charge.referenceMonth}`;
    assert(!allocations.has(key), 'Mensalidades duplicadas.');
    allocations.add(key);
    assert(typeof charge.paid === 'boolean', 'Estado de mensalidade inválido.');
    if (charge.paid) assert(payments.has(charge.paymentId), 'Mensalidade sem pagamento.');
  }
  for (const p of state.payments.filter((p) => p.confirmed)) {
    const months = (p.referenceMonth || '')
      .split('|')
      .map((m) => m.trim())
      .filter(Boolean);
    assert(
      months.length > 0 &&
        months.every(period) &&
        new Set(months).size === months.length &&
        months.length === p.numMonths,
      'Períodos de pagamento incoerentes.',
    );
    const allocated = state.charges.filter((c) => c.paid && c.paymentId === p.id);
    assert(
      allocated.length === months.length &&
        allocated.every((c) => c.customerId === p.customerId && months.includes(c.referenceMonth)),
      'Alocação de pagamento incompleta.',
    );
    if (p.periodAmounts)
      assert(
        allocated.every((c) => cents(p.periodAmounts[c.referenceMonth]) === cents(c.amount)),
        'Valores individuais incoerentes.',
      );
    assert(
      allocated.reduce((n, c) => n + cents(c.amount), 0) === cents(p.amount),
      'Alocações e montante do pagamento não coincidem.',
    );
  }
  const refs = new Set();
  for (const p of state.payments) {
    assert(typeof p.confirmed === 'boolean', 'Estado de pagamento inválido.');
    assert(
      customers.has(p.customerId) && users.has(p.createdBy),
      'Pagamento sem cliente ou autor; reconcilie antes de importar.',
    );
    cents(p.amount);
    assert(p.referenceCode && !refs.has(p.referenceCode), 'Referências de pagamento duplicadas.');
    refs.add(p.referenceCode);
  }
  for (const r of state.receipts) assert(payments.has(r.paymentId), 'Recibo sem pagamento.');
  assert(state.company && typeof state.company.name === 'string', 'Perfil da empresa inválido.');
  return state;
}

export function summaries(state) {
  return {
    revision: state.revision,
    customers: state.customers.length,
    payments: state.payments.length,
    receipts: state.receipts.length,
    charges: state.charges.length,
    paymentTotal:
      state.payments.filter((p) => p.confirmed).reduce((n, p) => n + cents(p.amount), 0) / 100,
  };
}
