import {randomBytes, scryptSync, timingSafeEqual, createHmac, randomUUID} from 'node:crypto';
export class AppError extends Error { constructor(status, message) { super(message); this.status=status; } }
export function assert(condition, message, status=422) { if(!condition) throw new AppError(status,message); }
export function hashPassword(password) {
 assert(typeof password==='string' && password.length>=6 && password.length<=128,'Credencial inválida.');
 const salt=randomBytes(16).toString('hex'); return `scrypt:${salt}:${scryptSync(password,salt,64).toString('hex')}`;
}
export function verifyPassword(password, hash) {
 if(typeof password!=='string' || password.length>128 || typeof hash!=='string')return false;
 const [kind,salt,key]=hash.split(':');if(kind!=='scrypt' || !/^[a-f0-9]{32}$/.test(salt || '') || !/^[a-f0-9]{128}$/.test(key || ''))return false;
 return timingSafeEqual(scryptSync(password,salt,64),Buffer.from(key,'hex'));
}
export function issueToken(user, secret, now=Date.now()) {
 assert(typeof secret==='string' && secret.length>=32,'A chave de sessão do servidor não está configurada.',503);
 const header=Buffer.from(JSON.stringify({alg:'HS256',typ:'JWT'})).toString('base64url');
 const payload=Buffer.from(JSON.stringify({sub:user.id,sv:user.sessionVersion || 0,iss:'wsm-vercel',aud:'wsm',exp:Math.floor(now/1000)+8*3600})).toString('base64url');
 const signature=createHmac('sha256',secret).update(`${header}.${payload}`).digest('base64url');return `${header}.${payload}.${signature}`;
}
export function authenticate(token, users, secret, now=Date.now()) {
 assert(typeof secret==='string' && secret.length>=32,'A chave de sessão do servidor não está configurada.',503);
 assert(typeof token==='string' && token.length<4096,'Sessão inválida.',401);
 const parts=token.split('.');assert(parts.length===3,'Sessão inválida.',401);
 const signature=createHmac('sha256',secret).update(parts.slice(0,2).join('.')).digest();let received;
 try{received=Buffer.from(parts[2],'base64url');}catch{throw new AppError(401,'Sessão inválida.');}
 assert(received.length===signature.length && timingSafeEqual(received,signature),'Sessão inválida.',401);
 let payload;try{payload=JSON.parse(Buffer.from(parts[1],'base64url').toString());}catch{throw new AppError(401,'Sessão inválida.');}
 const user=users.find(user=>user.id===payload.sub);
 assert(payload.iss==='wsm-vercel' && payload.aud==='wsm' && Number.isFinite(payload.exp) && payload.exp>Math.floor(now/1000) && user?.status==='ACTIVE' && (user.sessionVersion || 0)===payload.sv,'Sessão expirada ou conta desativada.',401);return user;
}
export const safeUser=user=>Object.fromEntries(['id','name','email','phone','login','role','status','createdAt'].map(key=>[key,user[key]]));
const operator=['dashboard.read','profile.read','customers.read','customers.edit','payments.read','payments.create','payments.annul.request','documents.issue'];
const manager=[...operator,'customers.create','customers.lifecycle','payments.annul.approve','reports.financial','billing.generate','audit.read'];
export const PERMISSIONS={ADMIN:[...manager,'company.manage','users.manage','tariffs.manage','technical.read'],MANAGER:manager,OPERATOR:operator,TECHNICIAN:['dashboard.read','profile.read','technical.read']};
export const can=(actor,permission)=>!!PERMISSIONS[actor?.role]?.includes(permission);
export function requirePermission(actor,permission){assert(can(actor,permission),'Sem autorização para esta operação.',403);}
export const id=()=>randomUUID();
export function cents(value){assert(typeof value==='number' && Number.isFinite(value) && value>=0 && Number.isSafeInteger(Math.round(value*100)) && Math.abs(value*100-Math.round(value*100))<0.00001,'Montante inválido.');return Math.round(value*100);}
export function period(value){return typeof value==='string' && /^(20(?:1[2-9]|[2-9]\d))-(0[1-9]|1[0-2])$/.test(value);}
export function nextPeriod(value){assert(period(value),'Período inválido.');const [y,m]=value.split('-').map(Number);const next=m===12?`${y+1}-01`:`${y}-${String(m+1).padStart(2,'0')}`;assert(period(next),'Período fora de 2012–2099.');return next;}
export function calendar(now=new Date()) {
 const parts=new Intl.DateTimeFormat('en-CA',{timeZone:'Africa/Maputo',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(now);
 const value=type=>parts.find(p=>p.type===type).value;return {month:`${value('year')}-${value('month')}`,day:Number(value('day'))};
}
export function audit(state,actor,action,target,now=new Date()) {state.audit.push({id:id(),actorId:actor.id,action,target,at:now.toISOString()});}
export function validateState(state) {
 assert(state && state.schemaVersion===1 && Number.isSafeInteger(state.revision) && state.revision>=0,'Formato ou versão de dados inválidos.');
 for(const name of ['customers','payments','receipts','users','charges','audit','requests']){
  assert(Array.isArray(state[name]),`Coleção ${name} inválida.`);
  if(name!=='requests'){const ids=state[name].map(x=>x?.id);assert(ids.every(x=>typeof x==='string' && x.length>0) && new Set(ids).size===ids.length,`Identificadores inválidos/duplicados em ${name}.`);}
 }
 assert(!state.sequences || typeof state.sequences==='object' && !Array.isArray(state.sequences) && Object.values(state.sequences).every(n=>Number.isSafeInteger(n) && n>=0),'Contadores inválidos.');
 const customers=new Set(state.customers.map(c=>c.id)),users=new Set(state.users.map(u=>u.id)),payments=new Set(state.payments.map(p=>p.id));
 assert(state.users.some(u=>u.role==='ADMIN' && u.status==='ACTIVE'),'É necessário um administrador ativo.');
 for(const u of state.users)assert(!('password' in u) && PERMISSIONS[u.role] && ['ACTIVE','INACTIVE','CREATED'].includes(u.status) && typeof u.login==='string' && /^scrypt:[a-f0-9]{32}:[a-f0-9]{128}$/.test(u.passwordHash || ''),'Utilizador inválido ou sem credencial protegida.');
 assert(new Set(state.users.map(u=>u.login.toLowerCase())).size===state.users.length,'Logins duplicados.');
 for(const c of state.customers){cents(c.monthlyFee);assert(Array.isArray(c.unpaidMonths) && c.unpaidMonths.every(period),'Períodos do cliente inválidos.');}
 const allocations=new Set();for(const charge of state.charges){assert(customers.has(charge.customerId) && period(charge.referenceMonth),'Mensalidade sem cliente/período válido.');cents(charge.amount);const key=`${charge.customerId}/${charge.referenceMonth}`;assert(!allocations.has(key),'Mensalidades duplicadas.');allocations.add(key);assert(typeof charge.paid==='boolean','Estado de mensalidade inválido.');if(charge.paid)assert(payments.has(charge.paymentId),'Mensalidade sem pagamento.');}
 for(const p of state.payments.filter(p=>p.confirmed)){
  const months=(p.referenceMonth || '').split('|').map(m=>m.trim()).filter(Boolean);
  assert(months.length>0 && months.every(period) && new Set(months).size===months.length && months.length===p.numMonths,'Períodos de pagamento incoerentes.');
  const allocated=state.charges.filter(c=>c.paid && c.paymentId===p.id);
  assert(allocated.length===months.length && allocated.every(c=>c.customerId===p.customerId && months.includes(c.referenceMonth)),'Alocação de pagamento incompleta.');
  if(p.periodAmounts)assert(allocated.every(c=>cents(p.periodAmounts[c.referenceMonth])===cents(c.amount)),'Valores individuais incoerentes.');
  assert(allocated.reduce((n,c)=>n+cents(c.amount),0)===cents(p.amount),'Alocações e montante do pagamento não coincidem.');
 }
 const refs=new Set();for(const p of state.payments){assert(typeof p.confirmed==='boolean','Estado de pagamento inválido.');assert(customers.has(p.customerId) && users.has(p.createdBy),'Pagamento sem cliente ou autor; reconcilie antes de importar.');cents(p.amount);assert(p.referenceCode && !refs.has(p.referenceCode),'Referências de pagamento duplicadas.');refs.add(p.referenceCode);}
 for(const r of state.receipts)assert(payments.has(r.paymentId),'Recibo sem pagamento.');
 assert(state.company && typeof state.company.name==='string','Perfil da empresa inválido.');return state;
}
export function summaries(state){return {revision:state.revision,customers:state.customers.length,payments:state.payments.length,receipts:state.receipts.length,charges:state.charges.length,paymentTotal:state.payments.filter(p=>p.confirmed).reduce((n,p)=>n+cents(p.amount),0)/100};}
export function refreshDebt(state,now=new Date()) {
 const today=calendar(now);if(!period(today.month))return;
 for(const c of state.customers){
  const charges=state.charges.filter(x=>x.customerId===c.id);const known=charges.map(x=>x.referenceMonth).sort();
  if(['ACTIVE','ATIVO'].includes(c.status) && known.length){const keys=new Set(known);let cursor=known[0];while(cursor<=today.month){if(!keys.has(cursor)){state.charges.push(chargeFor(c,cursor));keys.add(cursor);}if(cursor===today.month)break;cursor=nextPeriod(cursor);}}
  c.unpaidMonths=state.charges.filter(x=>x.customerId===c.id && !x.paid).map(x=>x.referenceMonth).sort();
  c.monthsInDebt=c.unpaidMonths.filter(m=>m<today.month || m===today.month && today.day>=11).length;
 }
}
export function chargeFor(c,month){return {id:id(),customerId:c.id,referenceMonth:month,amount:c.monthlyFee,paid:false,paidAt:'',paymentId:'',customerNameSnapshot:c.name,customerContactSnapshot:c.contact,customerAddressSnapshot:c.address,valveSnapshot:String(c.valve),customerStatusSnapshot:c.status,paymentReferenceCode:'',paymentMethod:'',createdByName:'',paymentDate:''};}
export function createPayment(state,payload,actor,now=new Date()) {
 requirePermission(actor,'payments.create');const c=state.customers.find(c=>c.id===payload.customerId);assert(c,'Cliente não encontrado.',404);assert(['ATIVO','ACTIVE'].includes(c.status),'Cliente inativo.');
 const count=payload.numMonths;assert(Number.isInteger(count) && count>0,'Número de meses inválido.');assert(['CASH','MPESA','EMOLA','BCI','BIM'].includes(payload.paymentMethod),'Método de pagamento inválido.');
 refreshDebt(state,now);const months=state.charges.filter(x=>x.customerId===c.id && !x.paid).sort((a,b)=>a.referenceMonth.localeCompare(b.referenceMonth));
 assert(count<=months.length,'Adiantamentos não disponíveis: selecione apenas mensalidades existentes.');const selected=months.slice(0,count),expected=selected.reduce((total,m)=>total+cents(m.amount),0);
 assert(Number.isSafeInteger(expected),'O montante excede o limite suportado.');
 assert(cents(payload.amount)===expected && expected>0,'O valor recebido deve corresponder exatamente às mensalidades mais antigas.');
 assert(!payload.tax || payload.tax===0,'Impostos adicionais não estão definidos.');
 const year=calendar(now).month.slice(0,4);let sequence=Number(state.sequences?.[year] || 0),referenceCode;
 do{sequence++;referenceCode=`REC-${year}-${String(sequence).padStart(6,'0')}`;}while(state.payments.some(p=>p.referenceCode===referenceCode));
 state.sequences={...state.sequences,[year]:sequence};
 const payment={id:id(),referenceCode,customerId:c.id,customerName:c.name,customerContact:c.contact,customerAddress:c.address,customerValve:c.valve,monthlyFee:c.monthlyFee,amount:expected/100,tax:0,unitPrice:selected[0].amount,confirmed:true,referenceMonth:selected.map(m=>m.referenceMonth).join('|'),numMonths:count,periodAmounts:Object.fromEntries(selected.map(m=>[m.referenceMonth,m.amount])),paymentDate:now.toISOString(),paymentMethod:payload.paymentMethod,createdBy:actor.id,createdByName:actor.name};
 state.payments.unshift(payment);for(const month of selected)Object.assign(month,{paid:true,paidAt:payment.paymentDate,paymentId:payment.id,paymentReferenceCode:referenceCode,paymentMethod:payment.paymentMethod,paymentDate:payment.paymentDate,createdByName:actor.name});
 state.receipts.unshift(receiptFor(payment));refreshDebt(state,now);audit(state,actor,'payment.created',payment.id,now);return payment;
}
export function receiptFor(p){return {id:id(),invoiceCode:p.referenceCode,paymentId:p.id,customerName:p.customerName,fileName:`RECIBO_${p.referenceCode}.pdf`,filePath:'',total:`${p.amount.toFixed(2)} MT`,monthDescription:p.referenceMonth,createdAt:p.paymentDate};}
export function safeReceipt(r,state){return {...r,payment:state.payments.find(p=>p.id===r.paymentId)};}
export function customerView(c,actor){return can(actor,'reports.financial')?c:{...c,monthlyFee:can(actor,'payments.create')?c.monthlyFee:undefined};}
export function anonymize(state) {
 const result=structuredClone(state),customerIds=new Map(result.customers.map((c,i)=>[c.id,`test-customer-${i+1}`])),paymentIds=new Map(result.payments.map((p,i)=>[p.id,`test-payment-${i+1}`]));
 result.customers=result.customers.map((c,i)=>({createdAt:c.createdAt,status:c.status,valve:c.valve,unpaidMonths:c.unpaidMonths,monthsInDebt:c.monthsInDebt,id:customerIds.get(c.id),code:`TEST-${i+1}`,name:`Cliente de teste ${i+1}`,contact:'',address:'Endereço de teste',monthlyFee:500}));
 const byId=new Map(result.customers.map(c=>[c.id,c]));
 result.payments=result.payments.map((p,i)=>{const c=byId.get(customerIds.get(p.customerId));return {confirmed:p.confirmed,referenceMonth:p.referenceMonth,numMonths:p.numMonths,paymentDate:p.paymentDate,paymentMethod:p.paymentMethod,id:paymentIds.get(p.id),referenceCode:`TEST-REC-${i+1}`,customerId:c.id,customerName:c.name,customerContact:'',customerAddress:c.address,customerValve:c.valve,monthlyFee:500,amount:500*p.numMonths,tax:0,unitPrice:500,periodAmounts:Object.fromEntries((p.referenceMonth || '').split('|').map(m=>[m.trim(),500])),createdBy:'test-admin',createdByName:'Administrador de teste'};});
 result.receipts=result.payments.filter(p=>p.confirmed).map(receiptFor);
 result.charges=result.charges.map((m,i)=>{const c=byId.get(customerIds.get(m.customerId));const p=result.payments.find(p=>p.id===paymentIds.get(m.paymentId));return {referenceMonth:m.referenceMonth,paid:m.paid,paidAt:m.paidAt,paymentDate:m.paymentDate,paymentMethod:m.paymentMethod,customerStatusSnapshot:m.customerStatusSnapshot,valveSnapshot:String(c.valve),id:`test-charge-${i+1}`,customerId:c.id,amount:500,customerNameSnapshot:c.name,customerContactSnapshot:'',customerAddressSnapshot:c.address,paymentId:p?.id || '',paymentReferenceCode:p?.referenceCode || '',createdByName:p?'Administrador de teste':''};});
 result.users=[{id:'test-admin',name:'Administrador de teste',email:'admin@example.test',phone:'',login:'adminAC',password:'123456',role:'ADMIN',status:'ACTIVE',createdAt:new Date().toISOString()}];
 result.company={name:'Empresa de teste',address:'Endereço de teste',contact:'840000000',email:'test@example.test',nuit:'123456789',tagline:'Dados fictícios',version:null};result.audit=[];result.requests=[];result.sequences={};result.revision=0;delete result.loginAttempts;delete result.lastSpringBackup;
 const allowed=new Set(['schemaVersion','revision','customers','payments','receipts','charges','users','company','audit','requests','sequences']);for(const key of Object.keys(result))if(!allowed.has(key))delete result[key];
 return {schemaVersion:1,sourceVersion:`test-${Date.now()}`,exportedAt:new Date().toISOString(),anonymized:true,state:result,company:result.company};
}
