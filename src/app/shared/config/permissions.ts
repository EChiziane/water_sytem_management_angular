import {UserRole} from '../models/user';
export type Permission = 'dashboard.read'|'profile.read'|'technical.read'|'company.manage'|'users.manage'|'customers.read'|'customers.create'|'customers.edit'|'customers.lifecycle'|'tariffs.manage'|'payments.read'|'payments.create'|'payments.annul.request'|'payments.annul.approve'|'documents.issue'|'reports.financial'|'billing.generate'|'audit.read';
const OPERATOR: Permission[]=['dashboard.read','profile.read','customers.read','customers.edit','payments.read','payments.create','payments.annul.request','documents.issue'];
const MANAGER: Permission[]=[...OPERATOR,'customers.create','customers.lifecycle','payments.annul.approve','reports.financial','billing.generate','audit.read'];
export const ROLE_PERMISSIONS: Record<UserRole,readonly Permission[]>={
 ADMIN:[...MANAGER,'company.manage','users.manage','tariffs.manage','technical.read'],
 MANAGER, OPERATOR, TECHNICIAN:['dashboard.read','profile.read','technical.read']
};
