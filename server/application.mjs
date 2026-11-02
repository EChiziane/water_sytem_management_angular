import {createHash} from 'node:crypto';
import {AppError,assert,can,requirePermission,safeUser,authenticate,issueToken,verifyPassword,hashPassword,validateState,createPayment,safeReceipt,chargeFor,refreshDebt,calendar,period,cents,id,audit,summaries,anonymize,PERMISSIONS} from './domain.mjs';
import {transact} from './store.mjs';
const digest=value=>createHash('sha256').update(JSON.stringify(value)).digest('hex');
function actorFor(req,state,secret){const header=req.headers?.authorization || '';assert(header.startsWith('Bearer '),'Inicie sessão para continuar.',401);return authenticate(header.slice(7),state.users,secret);}
function item(items,idValue){const value=items.find(x=>x.id===idValue);assert(value,'Registo não encontrado.',404);return value;}
function userInput(input,old={}){
 const user={...old};for(const k of ['name','email','phone','login','role','status'])if(input[k]!==undefined)user[k]=input[k];
 assert(typeof user.name==='string' && user.name.trim().length>0 && user.name.length<=100,'Nome inválido.');assert(typeof user.login==='string' && /^[A-Za-z0-9_.@-]{1,60}$/.test(user.login),'Login inválido.');
 assert(PERMISSIONS[user.role] && ['ACTIVE','INACTIVE','CREATED'].includes(user.status),'Perfil ou estado inválido.');
 if(input.password){assert(typeof input.password==='string' && input.password.length>=12,'Use uma credencial de pelo menos 12 caracteres em produção.');user.passwordHash=hashPassword(input.password);user.sessionVersion=(old.sessionVersion || 0)+1;}
 assert(user.passwordHash,'Defina uma credencial.');return user;
}
function customerInput(input,old={}) {
 const c={...old};for(const k of ['name','contact','address','status','valve','monthlyFee'])if(input[k]!==undefined)c[k]=input[k];
 assert(typeof c.name==='string' && c.name.trim().length>0 && c.name.length<=120,'Nome inválido.');
 assert(typeof c.contact==='string' && c.contact.length<=40 && typeof c.address==='string' && c.address.length<=240,'Contacto ou endereço inválido.');
 assert(['ATIVO','INATIVO','ACTIVE','CANCELLED','AWAITING_INSTALLATION'].includes(c.status),'Estado inválido.');
 assert(Number.isInteger(c.valve) && c.valve>=0 && c.valve<=99999,'Válvula inválida.');cents(c.monthlyFee);return c;
}
export async function dispatch(req,store,env=process.env,now=new Date()) {
 const url=new URL(req.url,'https://wsm.invalid');const pathname=(url.searchParams.get('path') || url.pathname.replace(/^\/api\/?/,'')).replace(/^\/|\/$/g,'');const method=req.method.toUpperCase();
 const body=req.body || {};assert(body && typeof body==='object' && !Array.isArray(body),'Pedido inválido.');assert(Buffer.byteLength(JSON.stringify(body))<3_000_000,'Pedido demasiado grande.',413);
 const segments=pathname.split('/');const [root,arg,action]=segments;
 const secret=env.WSM_SESSION_SECRET;assert(typeof secret==='string' && secret.length>=32,'Configure WSM_SESSION_SECRET antes de utilizar.',503);
 if(method==='POST' && pathname==='auth/login') {
  const {login,password}=body;assert(typeof login==='string' && login.length<=120 && typeof password==='string' && password.length<=128,'Credenciais inválidas.',401);
  const bucket=digest(login.toLowerCase());
  const response=await transact(store,state=>{
   state.loginAttempts=(state.loginAttempts || []).filter(a=>a.until>Date.now());let attempts=state.loginAttempts.find(a=>a.key===bucket);
   assert(!attempts || attempts.count<5,'Muitas tentativas. Aguarde 15 minutos.',429);
   const user=state.users.find(u=>u.login.toLowerCase()===login.toLowerCase());const valid=user?.status==='ACTIVE' && verifyPassword(password,user.passwordHash);
   if(!valid){if(attempts)attempts.count++;else{assert(state.loginAttempts.length<1000,'Tente novamente mais tarde.',429);state.loginAttempts.push({key:bucket,count:1,until:Date.now()+900000});}return null;}
   state.loginAttempts=state.loginAttempts.filter(a=>a.key!==bucket);refreshDebt(state,now);return {token:issueToken(user,secret),user:safeUser(user)};
  });assert(response,'Credenciais inválidas.',401);return response;
 }
 if(method==='GET' && pathname==='company/public') {const {state}=await store.read();const {name,address,contact,email,tagline}=state.company;return {name,address,contact,email,tagline};}
 const loaded=await store.read(),actor=actorFor(req,loaded.state,secret);const state=loaded.state;
 // This is computed on a clone for reads. POST sync/payment commits newly created obligations atomically.
 if(root==='customers' || root==='billing')refreshDebt(state,now);
 if(method==='GET') {
  if(pathname==='auth/me')return safeUser(actor);
  if(pathname==='auth/users'){requirePermission(actor,'users.manage');return state.users.map(safeUser);}
  if(root==='customers'){requirePermission(actor,'customers.read');return arg?item(state.customers,arg):state.customers;}
  if(root==='payments'){
   requirePermission(actor,'payments.read');if(arg==='customer')return state.payments.filter(p=>p.customerId===action);
   if(arg)return item(state.payments,arg);
   return state.payments.filter(p=>can(actor,'reports.financial') || p.createdBy===actor.id);
  }
  if(root==='receipts' || root==='customer_payments_invoice'){
   requirePermission(actor,'documents.issue');let receipts=state.receipts;
   if(arg==='payment')return receipts.filter(r=>r.paymentId===action).map(r=>safeReceipt(r,state));
   if(arg)return safeReceipt(item(receipts,arg==='download'?action:arg),state);
   return receipts.filter(r=>can(actor,'reports.financial') || state.payments.find(p=>p.id===r.paymentId)?.createdBy===actor.id).map(r=>safeReceipt(r,state));
  }
  if(root==='billing'){
   requirePermission(actor,arg==='customer'?'customers.read':'reports.financial');let charges=state.charges;
   if(arg==='customer'){item(state.customers,action);charges=charges.filter(c=>c.customerId===action);const operation=segments[3];
    if(operation==='unpaid')return charges.filter(c=>!c.paid).sort((a,b)=>a.referenceMonth.localeCompare(b.referenceMonth));
    if(operation==='debt-count')return item(state.customers,action).monthsInDebt;
    if(operation==='month'){const key=`${segments[4]}-${segments[5]}`;const charge=charges.find(c=>c.referenceMonth===key);assert(charge,'Mensalidade não encontrada.',404);return charge;}
   }return charges.sort((a,b)=>b.referenceMonth.localeCompare(a.referenceMonth));
  }
  if(root==='company'){requirePermission(actor,arg==='issuer'?'documents.issue':'company.manage');return state.company;}
  if(root==='audit'){requirePermission(actor,'audit.read');return state.audit;}
  if(root==='backups'){
   requirePermission(actor,'users.manage');if(arg==='status')return {...summaries(state),mode:'vercel-blob',lastSpringBackup:state.lastSpringBackup || null};
   if(arg==='export')return state;
   if(arg==='test-source')return store.readTestSource();
   if(arg==='file')return store.readBackup(action);
   return store.listBackups();
  }
  throw new AppError(404,'Operação não encontrada.');
 }
 if(root==='backups') {
  requirePermission(actor,'users.manage');
  if(method==='POST' && arg==='snapshot')return store.snapshot(state);
  if(method==='POST' && arg==='test-source'){
   assert(body.confirm===true,'Confirme a substituição da base de testes.');const copy=anonymize(state);await store.saveTestSource(copy);return copy;
  }
  if(method==='POST' && arg==='spring'){
   assert(env.SPRING_BACKUP_URL && env.SPRING_BACKUP_TOKEN?.length>=32,'Backup Spring não configurado.',503);
   const target=new URL(env.SPRING_BACKUP_URL);assert(target.protocol==='https:' || env.NODE_ENV!=='production' && ['localhost','127.0.0.1'].includes(target.hostname),'URL de backup insegura.',503);
   const snapshot=JSON.stringify(state);const checksum=createHash('sha256').update(snapshot).digest('hex');
   const response=await fetch(target,{method:'POST',headers:{'Content-Type':'application/json','X-Backup-Token':env.SPRING_BACKUP_TOKEN},body:JSON.stringify({snapshot,checksum,actorId:actor.id}),signal:AbortSignal.timeout(20000),redirect:'error'});
   assert(response.ok,'O Spring não confirmou o backup. Os dados na Vercel continuam guardados.',502);const saved=await response.json();assert(saved.checksum===checksum,'O Spring não confirmou a integridade do backup.',502);
   const backup={at:new Date().toISOString(),revision:state.revision,checksum};await transact(store,current=>{const user=actorFor(req,current,secret);requirePermission(user,'users.manage');current.lastSpringBackup=backup;audit(current,user,'backup.spring',checksum);});return backup;
  }
  throw new AppError(405,'Operação não permitida.');
 }
 // Financial mutation requests require a stable UUID. A retry returns the original result, never a second payment.
 const requestKey=req.headers['idempotency-key'];const financial=method==='POST' && root==='payments';
 if(financial)assert(typeof requestKey==='string' && /^[a-f0-9-]{36}$/i.test(requestKey),'Falta a chave de confirmação do pagamento.');
 return transact(store,current=>{
  const user=actorFor(req,current,secret);const requestDigest=digest({method,pathname,body});
  if(financial){requirePermission(user,'payments.create');const previous=current.requests.find(r=>r.key===requestKey && r.actorId===user.id);if(previous){assert(previous.digest===requestDigest,'Esta chave já foi usada para outro pagamento.',409);return item(current.payments,previous.resultId);}}
  let result;
  if(method==='POST' && pathname==='payments'){
   result=createPayment(current,body,user,now);current.requests.push({key:requestKey,actorId:user.id,digest:requestDigest,resultId:result.id});return result;
  }
  if(method==='POST' && pathname==='billing/sync'){requirePermission(user,'billing.generate');refreshDebt(current,now);audit(current,user,'billing.synced',calendar(now).month);return 'Mensalidades atualizadas.';}
  if(root==='customers' && (method==='POST' || method==='PUT')){
   requirePermission(user,method==='POST'?'customers.create':'customers.edit');
   if(method==='POST'){
    assert(!body.monthsInDebt,'Abertura de dívida exige importação com períodos explícitos, não um contador.');const c=customerInput(body);let n=current.customers.length+1,code;do{code=`WSM-${String(n++).padStart(3,'0')}`;}while(current.customers.some(c=>c.code===code));
    result={...c,id:id(),code,createdAt:now.toISOString(),unpaidMonths:[],monthsInDebt:0};current.customers.unshift(result);
   }else{
    const c=item(current.customers,arg);if(body.status!==undefined && body.status!==c.status || body.valve!==undefined && body.valve!==c.valve)requirePermission(user,'customers.lifecycle');
    assert(body.monthsInDebt===undefined || body.monthsInDebt===c.monthsInDebt,'Não é permitido alterar dívida pelo contador.');
    if(body.monthlyFee!==undefined && body.monthlyFee!==c.monthlyFee)requirePermission(user,'tariffs.manage');
    result=customerInput(body,c);Object.assign(c,result);
   }audit(current,user,'customer.saved',result.id);return result;
  }
  if(root==='auth' && ['POST','PUT','DELETE'].includes(method)){
   requirePermission(user,'users.manage');
   if(method==='POST' && arg==='register'){
    const login=body.login || (body.name || '').trim().split(/\s+/)[0].normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-zA-Z0-9]/g,'').toLowerCase()+'AC';
    result=userInput({...body,login,status:body.status || 'ACTIVE'});assert(!current.users.some(u=>u.login.toLowerCase()===result.login.toLowerCase()),'Login já utilizado.',409);result={...result,id:id(),createdAt:now.toISOString()};current.users.push(result);
   }else if(method==='PUT' || method==='DELETE'){
    const target=item(current.users,arg);const input=method==='DELETE'?{status:'INACTIVE'}:body;
    result=userInput(input,target);assert(target.id!==user.id || result.role===user.role && result.status==='ACTIVE','Não pode desativar ou alterar o seu próprio perfil de acesso.',409);
    assert(!current.users.some(u=>u.id!==target.id && u.login.toLowerCase()===result.login.toLowerCase()),'Login já utilizado.',409);
    assert(target.role!=='ADMIN' || target.status!=='ACTIVE' || result.role==='ADMIN' && result.status==='ACTIVE' || current.users.filter(u=>u.role==='ADMIN' && u.status==='ACTIVE').length>1,'É necessário manter um administrador ativo.',409);
    if(result.role!==target.role || result.status!==target.status)result.sessionVersion=(target.sessionVersion || 0)+1;Object.assign(target,result);
   }else throw new AppError(405,'Operação não permitida.');audit(current,user,'user.saved',result.id);return safeUser(result);
  }
  if(method==='PUT' && pathname==='company'){
   requirePermission(user,'company.manage');assert((body.version ?? null)===(current.company.version ?? null),'A empresa foi alterada por outro utilizador. Recarregue.',409);
   const limits={name:100,address:240,contact:30,email:120,nuit:9,tagline:160};const profile={};for(const [key,max]of Object.entries(limits)){assert(typeof body[key]==='string' && body[key].length<=max && (key==='tagline' || body[key].trim()),'Dados da empresa inválidos.');profile[key]=body[key].trim();}assert(/^\d{9}$/.test(profile.nuit) && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(profile.email),'NUIT ou email inválidos.');
   current.company={...profile,version:(current.company.version ?? -1)+1,updatedAt:now.toISOString(),updatedBy:user.id};audit(current,user,'company.saved','company');return current.company;
  }
  if(method==='POST' && (root==='receipts' || root==='customer_payments_invoice')){
   requirePermission(user,'documents.issue');const paymentId=root==='receipts'?body.paymentId:arg;const p=item(current.payments,paymentId);assert(p.confirmed,'Pagamento não confirmado.');return root==='receipts'?safeReceipt(current.receipts.find(r=>r.paymentId===p.id),current):p;
  }
  throw new AppError(403,'Operação indisponível: preserve o histórico.');
 });
}
