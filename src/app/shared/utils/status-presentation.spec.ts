import {describeStatus} from './status-presentation';

describe('Consistent status presentation',()=>{
 it('normalizes supported customer aliases without changing their lifecycle meaning',()=>{
   expect(describeStatus('customer','ATIVO')).toEqual(describeStatus('customer','ACTIVE'));
   expect(describeStatus('customer','INATIVO').label).toBe('statuses.inactive.label');
   expect(describeStatus('customer','CANCELLED').label).toBe('statuses.cancelled.label');
   expect(describeStatus('customer','AWAITING_INSTALLATION').tone).toBe('pending');
 });
 it('does not classify missing or unrecognized values as inactive or confirmed',()=>{
   for(const kind of ['customer','user','payment','monthly','debt'] as const)
     for(const value of [undefined,null,'UNRECOGNIZED'])expect(describeStatus(kind,value).label).toBe('statuses.unknown.label');
   expect(describeStatus('payment','false').label).toBe('statuses.unknown.label');
   expect(describeStatus('payment',false).label).toBe('statuses.unconfirmed.label');
 });
 it('shows created accounts as pending activation and inactive accounts neutrally',()=>{
   expect(describeStatus('user','CREATED').tone).toBe('pending');
   expect(describeStatus('user','INACTIVE').tone).toBe('neutral');
   expect(describeStatus('user','ACTIVE').label).toBe('statuses.active.label');
 });
 it('keeps active customer status separate from overdue debt',()=>{
   expect(describeStatus('customer','ACTIVE').tone).toBe('success');
   expect(describeStatus('debt',2).tone).toBe('warning');
   expect(describeStatus('debt',0).label).toBe('statuses.clear.label');
   for(const value of [-1,NaN,'',false])expect(describeStatus('debt',value).label).toBe('statuses.unknown.label');
 });
 it('uses the existing Maputo day-eleven rule across a year boundary',()=>{
   const before=new Date('2026-01-10T21:59:59Z');const after=new Date('2026-01-10T22:00:00Z');
   expect(describeStatus('monthly',false,'2026-01',before).label).toBe('statuses.pending.label');
   expect(describeStatus('monthly',false,'2026-01',after).label).toBe('statuses.overdue.label');
   expect(describeStatus('monthly',false,'2025-12',before).label).toBe('statuses.overdue.label');
   expect(describeStatus('monthly',false,'2026-02',after).label).toBe('statuses.pending.label');
   expect(describeStatus('monthly',true,'2025-12',after).label).toBe('statuses.paid.label');
 });
});
