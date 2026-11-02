import { assert, requirePermission, id, audit } from '../domain.mjs';
import { item } from './request-context.mjs';
import { customerInput } from './validation.mjs';
export function saveCustomer({ current, body, user, method, arg, now }) {
  let result;
  requirePermission(user, method === 'POST' ? 'customers.create' : 'customers.edit');
  if (method === 'POST') {
    assert(
      !body.monthsInDebt,
      'Abertura de dívida exige importação com períodos explícitos, não um contador.',
    );
    const c = customerInput(body);
    let n = current.customers.length + 1,
      code;
    do {
      code = `WSM-${String(n++).padStart(3, '0')}`;
    } while (current.customers.some((c) => c.code === code));
    result = {
      ...c,
      id: id(),
      code,
      createdAt: now.toISOString(),
      unpaidMonths: [],
      monthsInDebt: 0,
    };
    current.customers.unshift(result);
  } else {
    const c = item(current.customers, arg);
    if (
      (body.status !== undefined && body.status !== c.status) ||
      (body.valve !== undefined && body.valve !== c.valve)
    )
      requirePermission(user, 'customers.lifecycle');
    assert(
      body.monthsInDebt === undefined || body.monthsInDebt === c.monthsInDebt,
      'Não é permitido alterar dívida pelo contador.',
    );
    if (body.monthlyFee !== undefined && body.monthlyFee !== c.monthlyFee)
      requirePermission(user, 'tariffs.manage');
    result = customerInput(body, c);
    Object.assign(c, result);
  }
  audit(current, user, 'customer.saved', result.id);
  return result;
}
