import {
  assert,
  createPayment,
  refreshDebt,
  calendar,
  id,
  audit,
  AppError,
  requirePermission,
} from '../domain.mjs';
import { transact } from '../infrastructure/blob-store.mjs';
import { actorFor, digest, item } from './request-context.mjs';
import { login } from './login.mjs';
import { readResource } from './read-resource.mjs';
import { handleBackup } from './backups.mjs';
import { saveCustomer } from './customers.mjs';
import { saveUser } from './users.mjs';
import { saveCompany } from './company.mjs';
import { issueReceipt } from './receipts.mjs';
export async function dispatch(req, store, env = process.env, now = new Date()) {
  const url = new URL(req.url, 'https://wsm.invalid');
  const pathname = (url.searchParams.get('path') || url.pathname.replace(/^\/api\/?/, '')).replace(
    /^\/|\/$/g,
    '',
  );
  const method = req.method.toUpperCase();
  const body = req.body || {};
  assert(body && typeof body === 'object' && !Array.isArray(body), 'Pedido inválido.');
  assert(Buffer.byteLength(JSON.stringify(body)) < 3_000_000, 'Pedido demasiado grande.', 413);
  const segments = pathname.split('/');
  const [root, arg, action] = segments;
  const secret = env.WSM_SESSION_SECRET;
  assert(
    typeof secret === 'string' && secret.length >= 32,
    'Configure WSM_SESSION_SECRET antes de utilizar.',
    503,
  );
  if (method === 'POST' && pathname === 'auth/login') return login({ body, store, secret, now });
  if (method === 'GET' && pathname === 'company/public') {
    const { state } = await store.read();
    const { name, address, contact, email, tagline } = state.company;
    return { name, address, contact, email, tagline };
  }
  const loaded = await store.read(),
    actor = actorFor(req, loaded.state, secret);
  const state = loaded.state;
  // This is computed on a clone for reads. POST sync/payment commits newly created obligations atomically.
  if (root === 'customers' || root === 'billing') refreshDebt(state, now);
  if (method === 'GET')
    return readResource({ pathname, root, arg, action, segments, state, actor, store });
  if (root === 'backups')
    return handleBackup({ method, arg, body, state, store, actor, env, req, secret });
  // Financial mutation requests require a stable UUID. A retry returns the original result, never a second payment.
  const requestKey = req.headers['idempotency-key'];
  const financial = method === 'POST' && root === 'payments';
  if (financial)
    assert(
      typeof requestKey === 'string' && /^[a-f0-9-]{36}$/i.test(requestKey),
      'Falta a chave de confirmação do pagamento.',
    );
  return transact(store, (current) => {
    const user = actorFor(req, current, secret);
    const requestDigest = digest({ method, pathname, body });
    if (financial) {
      requirePermission(user, 'payments.create');
      const previous = current.requests.find((r) => r.key === requestKey && r.actorId === user.id);
      if (previous) {
        assert(
          previous.digest === requestDigest,
          'Esta chave já foi usada para outro pagamento.',
          409,
        );
        return item(current.payments, previous.resultId);
      }
    }
    let result;
    if (method === 'POST' && pathname === 'payments') {
      result = createPayment(current, body, user, now);
      current.requests.push({
        key: requestKey,
        actorId: user.id,
        digest: requestDigest,
        resultId: result.id,
      });
      return result;
    }
    if (method === 'POST' && pathname === 'billing/sync') {
      requirePermission(user, 'billing.generate');
      refreshDebt(current, now);
      audit(current, user, 'billing.synced', calendar(now).month);
      return 'Mensalidades atualizadas.';
    }
    if (root === 'customers' && (method === 'POST' || method === 'PUT'))
      return saveCustomer({ current, body, user, method, arg, now });
    if (root === 'auth' && ['POST', 'PUT', 'DELETE'].includes(method))
      return saveUser({ current, body, user, method, arg, now });
    if (method === 'PUT' && pathname === 'company')
      return saveCompany({ current, body, user, now });
    if (method === 'POST' && (root === 'receipts' || root === 'customer_payments_invoice'))
      return issueReceipt({ current, body, user, root, arg });
    throw new AppError(403, 'Operação indisponível: preserve o histórico.');
  });
}
