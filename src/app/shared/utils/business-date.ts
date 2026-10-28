/** Calendar and timestamps for the business timezone (UTC+02:00 in Maputo). */
export function maputoMonthKey(date: Date): string {
  if (!Number.isFinite(date.getTime())) return '';
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Africa/Maputo', year: 'numeric', month: '2-digit'
  }).formatToParts(date);
  return `${parts.find(part => part.type === 'year')?.value}-${parts.find(part => part.type === 'month')?.value}`;
}

/** API timestamps without an offset represent local business time. */
export function businessTimestamp(value: string): number {
  if (!value) return NaN;
  const localIso = /^\d{4}-\d{2}-\d{2}(?:T| )\d{2}:\d{2}(?::\d{2}(?:\.\d+)?)?$/;
  const normalized = localIso.test(value) ? `${value.replace(' ', 'T')}+02:00` : value;
  return new Date(normalized).getTime();
}
