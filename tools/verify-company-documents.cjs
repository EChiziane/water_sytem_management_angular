const fs=require('node:fs');const ts=require('typescript');const assert=require('node:assert/strict');
require.extensions['.ts']=(module,filename)=>module._compile(ts.transpileModule(fs.readFileSync(filename,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true}}).outputText,filename);
const {buildPaymentDocument}=require('../src/app/core/utils/payment-document.ts');
const {buildCustomerDocument}=require('../src/app/core/utils/customer-document.ts');
const seed=JSON.parse(fs.readFileSync('public/data/dev/water-data.json','utf8'));
const company={name:'Companhia de Água Central',nuit:'987654321',contact:'+258 840000000',email:'empresa@example.test',address:'Rua Nova 123, Maputo',tagline:'Abastecimento de água'};
fs.mkdirSync('tmp/pdfs',{recursive:true});
const docs={receipt:buildPaymentDocument(seed.payments[0],{company,issuedAt:'2026-10-29T10:00:00+02:00'}),customer:buildCustomerDocument(seed.customers[0],[seed.payments[0]],{company,includeHistory:true,issuedAt:new Date('2026-10-29T10:00:00+02:00')})};
for(const [name,doc] of Object.entries(docs)){assert.equal(doc.getNumberOfPages(),1);fs.writeFileSync(`tmp/pdfs/company-${name}.pdf`,Buffer.from(doc.output('arraybuffer')));}
console.log('Generated receipt and customer sheet from an injected company profile.');
