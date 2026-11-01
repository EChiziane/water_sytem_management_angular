import {isBillingPeriod} from './billing-period';
import {isOverdueMonth} from './billing-recovery';

export type StatusKind='customer'|'user'|'payment'|'monthly'|'debt';
export interface StatusPresentation { label:string; hint:string; tone:'success'|'pending'|'warning'|'neutral'; icon:string; }

const states:Record<string,Omit<StatusPresentation,'label'|'hint'>>={
  active:{tone:'success',icon:'check-circle'},
  inactive:{tone:'neutral',icon:'stop'},
  cancelled:{tone:'neutral',icon:'stop'},
  installation:{tone:'pending',icon:'clock-circle'},
  created:{tone:'pending',icon:'clock-circle'},
  confirmed:{tone:'success',icon:'check-circle'},
  unconfirmed:{tone:'pending',icon:'clock-circle'},
  paid:{tone:'success',icon:'check-circle'},
  pending:{tone:'pending',icon:'clock-circle'},
  overdue:{tone:'warning',icon:'clock-circle'},
  clear:{tone:'success',icon:'check-circle'},
  unknown:{tone:'neutral',icon:'info-circle'}
};

/** Presentation only: never changes stored states or decides whether a payment is accepted. */
export function describeStatus(kind:StatusKind,value:unknown,period?:string|null,now=new Date()):StatusPresentation {
  let key='unknown';
  const raw=typeof value==='string' ? value.trim().toUpperCase() : '';
  if(kind==='customer')key=({ATIVO:'active',ACTIVE:'active',INATIVO:'inactive',INACTIVE:'inactive',CANCELLED:'cancelled',CANCELADO:'cancelled',AWAITING_INSTALLATION:'installation'} as Record<string,string>)[raw] || key;
  if(kind==='user')key=({ACTIVE:'active',INACTIVE:'inactive',CREATED:'created'} as Record<string,string>)[raw] || key;
  if(kind==='payment')key=value===true?'confirmed':value===false?'unconfirmed':key;
  if(kind==='monthly')key=value===true?'paid':value===false && !!period && isBillingPeriod(period)?(isOverdueMonth(period,now)?'overdue':'pending'):key;
  if(kind==='debt'){
    const count=typeof value==='number'?value:typeof value==='string' && /^\d+$/.test(value.trim())?Number(value):NaN;
    if(Number.isSafeInteger(count) && count>=0)key=count>0?'overdue':'clear';
  }
  return {...states[key],label:`statuses.${key}.label`,hint:`statuses.${key}.hint`};
}
