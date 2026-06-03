import {UserRole} from '@shared/models/user';

export const MONTH_NAMES_PT = [
  'Janeiro',
  'Fevereiro',
  'Março',
  'Abril',
  'Maio',
  'Junho',
  'Julho',
  'Agosto',
  'Setembro',
  'Outubro',
  'Novembro',
  'Dezembro'
] as const;

export const ROLE_LABELS: Record<UserRole, string> = {
  ADMIN: 'Administrador',
  MANAGER: 'Gestor',
  OPERATOR: 'Operador'
};

export const ROLE_OPTIONS = [
  {label: ROLE_LABELS.ADMIN, value: 'ADMIN' as const},
  {label: ROLE_LABELS.MANAGER, value: 'MANAGER' as const},
  {label: ROLE_LABELS.OPERATOR, value: 'OPERATOR' as const}
];
