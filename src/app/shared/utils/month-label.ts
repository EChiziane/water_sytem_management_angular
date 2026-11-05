/** Display only: never changes the stored YYYY-MM period. */
export function formatMonthLabel(period: string, locale = 'pt-MZ'): string {
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(period)) return period || '—';
  const value = new Intl.DateTimeFormat(locale, {
    month: 'long',
    year: 'numeric',
    timeZone: 'Africa/Maputo',
  }).format(new Date(period + '-01T12:00:00+02:00'));
  return value.charAt(0).toLocaleUpperCase(locale) + value.slice(1);
}
