import { requirePermission, safeUser, can, safeReceipt, summaries, AppError } from '../domain.mjs';
import { item } from './request-context.mjs';
export async function readResource({ pathname, root, arg, action, segments, state, actor, store }) {
  if (pathname === 'auth/me') return safeUser(actor);
  if (pathname === 'auth/users') {
    requirePermission(actor, 'users.manage');
    return state.users.map(safeUser);
  }
  if (root === 'customers') {
    requirePermission(actor, 'customers.read');
    return arg ? item(state.customers, arg) : state.customers;
  }
  if (root === 'payments') {
    requirePermission(actor, 'payments.read');
    if (arg === 'customer') return state.payments.filter((p) => p.customerId === action);
    if (arg) return item(state.payments, arg);
    return state.payments.filter(
      (p) => can(actor, 'reports.financial') || p.createdBy === actor.id,
    );
  }
  if (root === 'receipts' || root === 'customer_payments_invoice') {
    requirePermission(actor, 'documents.issue');
    let receipts = state.receipts;
    if (arg === 'payment')
      return receipts.filter((r) => r.paymentId === action).map((r) => safeReceipt(r, state));
    if (arg) return safeReceipt(item(receipts, arg === 'download' ? action : arg), state);
    return receipts
      .filter(
        (r) =>
          can(actor, 'reports.financial') ||
          state.payments.find((p) => p.id === r.paymentId)?.createdBy === actor.id,
      )
      .map((r) => safeReceipt(r, state));
  }
  if (root === 'billing') {
    requirePermission(actor, arg === 'customer' ? 'customers.read' : 'reports.financial');
    let charges = state.charges;
    if (arg === 'customer') {
      item(state.customers, action);
      charges = charges.filter((c) => c.customerId === action);
      const operation = segments[3];
      if (operation === 'unpaid')
        return charges
          .filter((c) => !c.paid)
          .sort((a, b) => a.referenceMonth.localeCompare(b.referenceMonth));
      if (operation === 'debt-count') return item(state.customers, action).monthsInDebt;
      if (operation === 'month') {
        const key = `${segments[4]}-${segments[5]}`;
        const charge = charges.find((c) => c.referenceMonth === key);
        assert(charge, 'Mensalidade não encontrada.', 404);
        return charge;
      }
    }
    return charges.sort((a, b) => b.referenceMonth.localeCompare(a.referenceMonth));
  }
  if (root === 'company') {
    requirePermission(actor, arg === 'issuer' ? 'documents.issue' : 'company.manage');
    return state.company;
  }
  if (root === 'audit') {
    requirePermission(actor, 'audit.read');
    return state.audit;
  }
  if (root === 'backups') {
    requirePermission(actor, 'users.manage');
    if (arg === 'status')
      return {
        ...summaries(state),
        mode: 'vercel-blob',
        lastSpringBackup: state.lastSpringBackup || null,
      };
    if (arg === 'export') return state;
    if (arg === 'test-source') return store.readTestSource();
    if (arg === 'file') return store.readBackup(action);
    return store.listBackups();
  }
  throw new AppError(404, 'Operação não encontrada.');
}
