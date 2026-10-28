import {recoverLocalBilling, isOverdueMonth} from './billing-recovery';
import {Customer} from '@shared/models/WSM/customer';
import {Payment} from '@shared/models/WSM/payment';

describe('Local demonstration billing recovery', () => {
  const customer: Customer = {id:'c1', code:'C1', name:'Cliente', contact:'', address:'', status:'ATIVO', valve:1, monthlyFee:750, monthsInDebt:0, unpaidMonths:[], createdAt:'2026-01-01'};
  const paid = (months: string): Payment => ({id:'p1', customerId:'c1', referenceMonth:months, confirmed:true} as Payment);
  const october30 = new Date('2026-10-30T10:00:00Z');
  it('recovers September and October when August was paid and the recorded debt was zero', () => {
    const result = recoverLocalBilling([customer],[paid('2026-08')],october30)[0];
    expect(result.unpaidMonths).toEqual(['2026-09','2026-10']);
    expect(result.monthsInDebt).toBe(2);
    expect(customer.monthsInDebt).toBe(0);
    expect(recoverLocalBilling([result],[paid('2026-08')],october30)).toEqual([result]);
  });
  it('includes October as payable from the start and only marks it overdue on day eleven', () => {
    const before = recoverLocalBilling([customer],[paid('2026-08')],new Date('2026-10-10T21:59:59Z'))[0];
    const after = recoverLocalBilling([before],[paid('2026-08')],new Date('2026-10-10T22:00:00Z'))[0];
    expect(before.unpaidMonths).toEqual(['2026-09','2026-10']);
    expect(before.monthsInDebt).toBe(1);
    expect(after.monthsInDebt).toBe(2);
  });
  it('preserves advance payments and recovers only missing unpaid periods', () => {
    const result = recoverLocalBilling([customer],[paid('2026-08 | 2026-10 | 2026-11')],october30)[0];
    expect(result.unpaidMonths).toEqual(['2026-09']);
  });
  it('preserves old inactive debt without creating more monthly charges', () => {
    const result = recoverLocalBilling([{...customer,status:'INATIVO',unpaidMonths:['2026-08']}],[],october30)[0];
    expect(result.unpaidMonths).toEqual(['2026-08']);
  });
  it('does not invent installation or initial charges for an account without any billing history', () => {
    expect(recoverLocalBilling([customer],[],october30)[0].unpaidMonths).toEqual([]);
  });
  it('recovers a year change and excludes future months from overdue debt', () => {
    const result = recoverLocalBilling([customer],[paid('2026-12')],new Date('2026-12-31T22:00:00Z'))[0];
    expect(result.unpaidMonths).toEqual(['2027-01']);
    expect(result.monthsInDebt).toBe(0);
    expect(isOverdueMonth('2027-02',new Date('2027-01-30T12:00:00Z'))).toBeFalse();
  });
});
