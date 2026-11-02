import { businessTimestamp, maputoMonthKey } from './business-date';

describe('Business calendar in Africa/Maputo', () => {
  it('uses Maputo at the UTC month boundary including a year change', () => {
    expect(maputoMonthKey(new Date('2026-09-30T21:59:59Z'))).toBe('2026-09');
    expect(maputoMonthKey(new Date('2026-09-30T22:00:00Z'))).toBe('2026-10');
    expect(maputoMonthKey(new Date('2026-12-31T22:00:00Z'))).toBe('2027-01');
  });
  it('interprets API timestamps without offsets as business local time', () => {
    expect(businessTimestamp('2026-10-01T00:00:00')).toBe(Date.parse('2026-09-30T22:00:00Z'));
    expect(businessTimestamp('2026-10-01T00:00:00+02:00')).toBe(Date.parse('2026-09-30T22:00:00Z'));
    expect(Number.isNaN(businessTimestamp('invalid'))).toBeTrue();
    expect(maputoMonthKey(new Date('invalid'))).toBe('');
  });
});
