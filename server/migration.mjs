import {assert,hashPassword,chargeFor,validateState,cents,period,receiptFor,id} from './domain.mjs';
export function migrateBackup(input,passwords={}) {
 if(typeof input.raw==='string')input={...input,...JSON.parse(input.raw)};
 const source=input.state || input;assert(source && ['customers','payments','receipts','users'].every(k=>Array.isArray(source[k])),'A cópia não contém todas as coleções.');
 const state=structuredClone(source);
 for(const u of state.users){
  const supplied=passwords[u.login];
  if(supplied) {assert(typeof supplied==='string' && supplied.length>=12,'Credenciais de produção devem ter pelo menos 12 caracteres.');u.passwordHash=hashPassword(supplied);}
  else if(!u.passwordHash){assert(typeof u.password==='string' && u.password.length>=12,`Defina WSM_INITIAL_PASSWORDS_JSON para o login ${u.login}; não será importado um PIN fraco.`);u.passwordHash=hashPassword(u.password);}
  delete u.password;u.sessionVersion=u.sessionVersion || 0;
 }
 state.schemaVersion=1;state.revision=Number.isSafeInteger(state.revision)?state.revision:0;
 state.company=input.company || state.company;assert(state.company && typeof state.company.name==='string','Exporte também o perfil da empresa.');
 state.audit=state.audit || [];state.requests=state.requests || [];state.sequences=state.sequences || {};
 state.charges=state.charges || [];
 if(!state.charges.length){
  const charges=new Map();
  for(const c of state.customers){assert(Array.isArray(c.unpaidMonths),'É necessário indicar os meses explicitamente, não apenas o contador da dívida.');for(const month of c.unpaidMonths){assert(period(month),'Período legado inválido.');charges.set(`${c.id}/${month}`,chargeFor(c,month));}}
  for(const p of state.payments.filter(p=>p.confirmed)){
   const c=state.customers.find(c=>c.id===p.customerId);assert(c,'Pagamento sem cliente.');
   const months=(p.referenceMonth || '').split('|').map(x=>x.trim()).filter(Boolean);assert(months.length>0 && months.every(period) && new Set(months).size===months.length,'Pagamento sem períodos válidos.');
   const total=cents(p.amount);let allocated=0;
   for(const [index,month] of months.entries()){
    const key=`${c.id}/${month}`,old=charges.get(key);assert(!old?.paid,'Dois pagamentos liquidam o mesmo mês; reconcilie a cópia antes de importar.');
    const amount=p.periodAmounts?.[month] ?? (Math.floor(total/months.length)+(index<total%months.length?1:0))/100;allocated+=cents(amount);
    charges.set(key,{...chargeFor(c,month),amount,amountEstimated:p.periodAmounts?.[month]===undefined,paid:true,paidAt:p.paymentDate,paymentId:p.id,paymentReferenceCode:p.referenceCode,paymentMethod:p.paymentMethod,paymentDate:p.paymentDate,createdByName:p.createdByName,customerNameSnapshot:p.customerName,customerContactSnapshot:p.customerContact,customerAddressSnapshot:p.customerAddress});
   }assert(allocated===total,'A alocação histórica não corresponde ao montante do pagamento.');
  }
  state.charges=[...charges.values()];
 }
 // Preserve every original receipt ID. Create only a missing receipt for an existing confirmed payment.
 for(const p of state.payments.filter(p=>p.confirmed))if(!state.receipts.some(r=>r.paymentId===p.id))state.receipts.push(receiptFor(p));
 for(const r of state.receipts)delete r.payment;
 state.updatedAt=new Date().toISOString();state.audit.push({id:id(),actorId:'migration',action:'state.imported',target:input.sourceVersion || 'explicit-import',at:state.updatedAt});
 return validateState(state);
}
