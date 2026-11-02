import { assert, requirePermission, safeReceipt } from '../domain.mjs';
import { item } from './request-context.mjs';
export function issueReceipt({ current, body, user, root, arg }) {
  requirePermission(user, 'documents.issue');
  const paymentId = root === 'receipts' ? body.paymentId : arg;
  const p = item(current.payments, paymentId);
  assert(p.confirmed, 'Pagamento não confirmado.');
  return root === 'receipts'
    ? safeReceipt(
        current.receipts.find((r) => r.paymentId === p.id),
        current,
      )
    : p;
}
