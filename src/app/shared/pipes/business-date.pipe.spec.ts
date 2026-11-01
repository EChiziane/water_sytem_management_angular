import {BusinessDatePipe} from './business-date.pipe';
describe('Business date output',()=>{
 const pipe=new BusinessDatePipe();
 it('displays API local timestamps and equivalent UTC instants identically',()=>{expect(pipe.transform('2026-11-01T08:30:00')).toBe('01/11/2026 08:30');expect(pipe.transform('2026-11-01T06:30:00Z')).toBe('01/11/2026 08:30');});
 it('uses the Maputo year at the UTC year boundary',()=>{expect(pipe.transform('2026-12-31T22:30:00Z')).toBe('01/01/2027 00:30');expect(pipe.transform('2026-12-31T22:30:00Z','month')).toBe('01/2027');});
 it('does not invent dates for missing or invalid values',()=>{for(const value of [null,undefined,'', 'invalid',new Date(NaN)])expect(pipe.transform(value)).toBe('—');});
});
