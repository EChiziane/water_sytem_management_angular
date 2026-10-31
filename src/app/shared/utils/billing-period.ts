import {businessTimestamp, maputoMonthKey} from './business-date';

export const FIRST_BUSINESS_YEAR = 2012;
export const LAST_BUSINESS_YEAR = 2099;
export const BUSINESS_YEARS = Array.from({length: LAST_BUSINESS_YEAR - FIRST_BUSINESS_YEAR + 1}, (_, index) => LAST_BUSINESS_YEAR - index);

export function isBillingPeriod(value: string): boolean {
  return /^(20\d{2})-(0[1-9]|1[0-2])$/.test(value) && Number(value.slice(0, 4)) >= FIRST_BUSINESS_YEAR && Number(value.slice(0, 4)) <= LAST_BUSINESS_YEAR;
}

export function nextBillingPeriod(value: string): string {
  if(!isBillingPeriod(value))throw new Error('Período fora do intervalo 2012–2099.');
  const [year, month] = value.split('-').map(Number);
  if(year === LAST_BUSINESS_YEAR && month === 12)throw new Error('Limite do calendário de cobrança atingido.');
  return month === 12 ? `${year + 1}-01` : `${year}-${String(month + 1).padStart(2, '0')}`;
}

export function paymentPeriods(reference: string): string[] {
  return [...new Set((reference || '').split('|').map(value => value.trim()).filter(isBillingPeriod))].sort();
}

export function matchesBusinessYear(timestamp: string, year: number | null): boolean {
  return year === null || maputoMonthKey(new Date(businessTimestamp(timestamp))).startsWith(`${year}-`);
}
