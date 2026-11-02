import { Permission } from '@shared/config/permissions';

export interface NavigationItem {
  label: string;
  icon: string;
  path: string;
  permission: Permission;
  detailsPath?: string;
}
export interface NavigationGroup {
  key: string;
  label: string;
  items: NavigationItem[];
}

/** Shared order and access rules for desktop and mobile navigation. */
export const NAVIGATION_GROUPS: NavigationGroup[] = [
  {
    key: 'general',
    label: 'layout.sections.general',
    items: [
      {
        label: 'layout.nav.dashboard',
        icon: 'dashboard',
        path: '/app/dashboard',
        permission: 'dashboard.read',
      },
    ],
  },
  {
    key: 'operations',
    label: 'layout.sections.operations',
    items: [
      {
        label: 'layout.nav.customers',
        icon: 'team',
        path: '/app/customer',
        detailsPath: '/app/customer-detail',
        permission: 'customers.read',
      },
      {
        label: 'layout.nav.payments',
        icon: 'credit-card',
        path: '/app/payment',
        detailsPath: '/app/payment-detail',
        permission: 'payments.read',
      },
      {
        label: 'layout.nav.receipts',
        icon: 'file-text',
        path: '/app/receipts',
        permission: 'documents.issue',
      },
    ],
  },
  {
    key: 'administration',
    label: 'layout.sections.administration',
    items: [
      {
        label: 'layout.nav.company',
        icon: 'bank',
        path: '/app/company',
        permission: 'company.manage',
      },
      {
        label: 'layout.nav.users',
        icon: 'user-switch',
        path: '/app/users',
        permission: 'users.manage',
      },
    ],
  },
  {
    key: 'account',
    label: 'layout.sections.account',
    items: [
      {
        label: 'layout.nav.profile',
        icon: 'user',
        path: '/app/profile',
        permission: 'profile.read',
      },
    ],
  },
];
