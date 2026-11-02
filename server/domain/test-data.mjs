import { receiptFor } from './payments.mjs';

export function anonymize(state) {
  const result = structuredClone(state),
    customerIds = new Map(result.customers.map((c, i) => [c.id, `test-customer-${i + 1}`])),
    paymentIds = new Map(result.payments.map((p, i) => [p.id, `test-payment-${i + 1}`]));
  result.customers = result.customers.map((c, i) => ({
    createdAt: c.createdAt,
    status: c.status,
    valve: c.valve,
    unpaidMonths: c.unpaidMonths,
    monthsInDebt: c.monthsInDebt,
    id: customerIds.get(c.id),
    code: `TEST-${i + 1}`,
    name: `Cliente de teste ${i + 1}`,
    contact: '',
    address: 'Endereço de teste',
    monthlyFee: 500,
  }));
  const byId = new Map(result.customers.map((c) => [c.id, c]));
  result.payments = result.payments.map((p, i) => {
    const c = byId.get(customerIds.get(p.customerId));
    return {
      confirmed: p.confirmed,
      referenceMonth: p.referenceMonth,
      numMonths: p.numMonths,
      paymentDate: p.paymentDate,
      paymentMethod: p.paymentMethod,
      id: paymentIds.get(p.id),
      referenceCode: `TEST-REC-${i + 1}`,
      customerId: c.id,
      customerName: c.name,
      customerContact: '',
      customerAddress: c.address,
      customerValve: c.valve,
      monthlyFee: 500,
      amount: 500 * p.numMonths,
      tax: 0,
      unitPrice: 500,
      periodAmounts: Object.fromEntries(
        (p.referenceMonth || '').split('|').map((m) => [m.trim(), 500]),
      ),
      createdBy: 'test-admin',
      createdByName: 'Administrador de teste',
    };
  });
  result.receipts = result.payments.filter((p) => p.confirmed).map(receiptFor);
  result.charges = result.charges.map((m, i) => {
    const c = byId.get(customerIds.get(m.customerId));
    const p = result.payments.find((p) => p.id === paymentIds.get(m.paymentId));
    return {
      referenceMonth: m.referenceMonth,
      paid: m.paid,
      paidAt: m.paidAt,
      paymentDate: m.paymentDate,
      paymentMethod: m.paymentMethod,
      customerStatusSnapshot: m.customerStatusSnapshot,
      valveSnapshot: String(c.valve),
      id: `test-charge-${i + 1}`,
      customerId: c.id,
      amount: 500,
      customerNameSnapshot: c.name,
      customerContactSnapshot: '',
      customerAddressSnapshot: c.address,
      paymentId: p?.id || '',
      paymentReferenceCode: p?.referenceCode || '',
      createdByName: p ? 'Administrador de teste' : '',
    };
  });
  result.users = [
    {
      id: 'test-admin',
      name: 'Administrador de teste',
      email: 'admin@example.test',
      phone: '',
      login: 'adminAC',
      password: '123456',
      role: 'ADMIN',
      status: 'ACTIVE',
      createdAt: new Date().toISOString(),
    },
  ];
  result.company = {
    name: 'Empresa de teste',
    address: 'Endereço de teste',
    contact: '840000000',
    email: 'test@example.test',
    nuit: '123456789',
    tagline: 'Dados fictícios',
    version: null,
  };
  result.audit = [];
  result.requests = [];
  result.sequences = {};
  result.revision = 0;
  delete result.loginAttempts;
  delete result.lastSpringBackup;
  const allowed = new Set([
    'schemaVersion',
    'revision',
    'customers',
    'payments',
    'receipts',
    'charges',
    'users',
    'company',
    'audit',
    'requests',
    'sequences',
  ]);
  for (const key of Object.keys(result)) if (!allowed.has(key)) delete result[key];
  return {
    schemaVersion: 1,
    sourceVersion: `test-${Date.now()}`,
    exportedAt: new Date().toISOString(),
    anonymized: true,
    state: result,
    company: result.company,
  };
}
