import { assert } from '../shared/errors.mjs';

const operator = [
  'dashboard.read',
  'profile.read',
  'customers.read',
  'customers.edit',
  'payments.read',
  'payments.create',
  'payments.annul.request',
  'documents.issue',
];

const manager = [
  ...operator,
  'customers.create',
  'customers.lifecycle',
  'payments.annul.approve',
  'reports.financial',
  'billing.generate',
  'audit.read',
];

export const PERMISSIONS = {
  ADMIN: [...manager, 'company.manage', 'users.manage', 'tariffs.manage', 'technical.read'],
  MANAGER: manager,
  OPERATOR: operator,
  TECHNICIAN: ['dashboard.read', 'profile.read', 'technical.read'],
};

export const can = (actor, permission) => !!PERMISSIONS[actor?.role]?.includes(permission);

export function requirePermission(actor, permission) {
  assert(can(actor, permission), 'Sem autorização para esta operação.', 403);
}
