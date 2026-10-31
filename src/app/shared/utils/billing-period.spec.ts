import {BUSINESS_YEARS,isBillingPeriod,nextBillingPeriod,matchesBusinessYear,paymentPeriods} from './billing-period';
import {recoverLocalBilling,isOverdueMonth} from './billing-recovery';
import {Customer} from '@shared/models/WSM/customer';
import {Payment} from '@shared/models/WSM/payment';
import {CalendarComponent} from '../../features/calendar/calendar.component';

describe('Multi-year billing, 2012–2099',()=>{
 const customer={id:'c',status:'ATIVO',unpaidMonths:[],monthsInDebt:0} as unknown as Customer;
 const paid=(referenceMonth:string)=>({customerId:'c',confirmed:true,referenceMonth}) as Payment;
 it('crosses every supported December–January boundary without duplicates or losing paid periods',()=>{
   for(let year=2012;year<2099;year++){
     const now=new Date(`${year+1}-01-11T12:00:00+02:00`);
     const payments=[paid(`${year}-11|${year+1}-02`)];
     const result=recoverLocalBilling([customer],payments,now)[0];
     expect(result.unpaidMonths).toEqual([`${year}-12`,`${year+1}-01`]);expect(result.monthsInDebt).toBe(2);
     expect(recoverLocalBilling([result],payments,now)).toEqual([result]);
   }
 });
 it('handles the complete supported lifespan without resetting debt at January',()=>{
   const payments=[paid('2012-01')];const now=new Date('2099-12-31T12:00:00+02:00');
   const result=recoverLocalBilling([customer],payments,now)[0];
   expect(result.unpaidMonths.length).toBe(1055);expect(result.unpaidMonths[0]).toBe('2012-02');expect(result.unpaidMonths.at(-1)).toBe('2099-12');
 });
 it('uses the Maputo year when a payment falls at midnight on January first',()=>{
   expect(matchesBusinessYear('2025-12-31T22:00:00Z',2026)).toBeTrue();
   expect(matchesBusinessYear('2025-12-31T21:59:59Z',2025)).toBeTrue();
   expect(matchesBusinessYear('2026-01-01T00:00:00',2025)).toBeFalse();
 });
 it('supports leap February and preserves the day-eleven rule',()=>{
   expect(isOverdueMonth('2024-02',new Date('2024-02-29T12:00:00Z'))).toBeTrue();
   expect(isOverdueMonth('2024-03',new Date('2024-02-29T22:00:00Z'))).toBeFalse();
 });
 it('validates period limits and never wraps December 2099 to an unsupported year',()=>{
   expect(BUSINESS_YEARS.length).toBe(88);expect(isBillingPeriod('2012-01')).toBeTrue();expect(isBillingPeriod('2099-12')).toBeTrue();
   for(const period of ['2011-12','2100-01','2026-00','2026-13'])expect(isBillingPeriod(period)).toBeFalse();
   expect(()=>nextBillingPeriod('2099-12')).toThrow();
   expect(paymentPeriods('2026-01 | 2025-12 | 2026-01')).toEqual(['2025-12','2026-01']);
 });
 it('does not charge since 2012 for a customer without a known billing anchor',()=>{
   expect(recoverLocalBilling([customer],[],new Date('2026-12-31T22:00:00Z'))[0].unpaidMonths).toEqual([]);
 });
 it('does not erase unsupported legacy periods in an automatic scan',()=>{
   const legacy={...customer,unpaidMonths:['2011-12'],monthsInDebt:1};
   expect(recoverLocalBilling([legacy],[],new Date('2026-01-15T12:00:00Z'))[0]).toEqual(legacy);
 });
 it('navigates calendar years correctly and respects both bounds and leap days',()=>{
   const calendar=new CalendarComponent();calendar.year=2025;calendar.month=11;calendar.nextMonth();expect([calendar.year,calendar.month]).toEqual([2026,0]);
   calendar.prevMonth();expect([calendar.year,calendar.month]).toEqual([2025,11]);
   calendar.year=2012;calendar.month=0;calendar.prevMonth();expect(calendar.year).toBe(2012);expect(calendar.month).toBe(0);
   calendar.year=2099;calendar.month=11;calendar.nextMonth();expect(calendar.year).toBe(2099);expect(calendar.month).toBe(11);
   calendar.year=2024;calendar.month=1;calendar.updateCalendar();expect(calendar.displayDays.filter(Boolean).length).toBe(29);
 });
});
