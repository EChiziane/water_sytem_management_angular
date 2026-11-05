import { formatMonthLabel } from './month-label';
import type { Payment } from '../models/payment';

export function money(value: number | null | undefined): string {
  return `${new Intl.NumberFormat('pt-MZ', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Number(value || 0))} MT`;
}

export function paymentMethodLabel(method: string | null | undefined): string {
  const labels: Record<string, string> = {
    CASH: 'Numerário',
    MPESA: 'M-Pesa',
    EMOLA: 'e-Mola',
    BANK_TRANSFER: 'Transferência bancária',
    TRANSFER: 'Transferência bancária',
    CARD: 'Cartão',
    POS: 'Cartão / POS',
  };
  return labels[(method || '').toUpperCase()] || method || 'Não informado';
}

export function referenceMonths(reference: string | null | undefined): string[] {
  return (reference || '')
    .split('|')
    .map((value) => value.trim())
    .filter(Boolean)
    .map((value) => {
      const match = /^(\d{4})-(0[1-9]|1[0-2])$/.exec(value);
      if (!match) return value;
      return formatMonthLabel(value);
    });
}

export function paymentDate(value: string | Date | null | undefined): string {
  if (!value || Number.isNaN(new Date(value).getTime())) return 'Não informada';
  return new Intl.DateTimeFormat('pt-MZ', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    timeZone: 'Africa/Maputo',
  }).format(new Date(value));
}

export function paymentQuantity(payment: Payment): number {
  return Number(payment.numMonths) > 0
    ? Number(payment.numMonths)
    : referenceMonths(payment.referenceMonth).length;
}
