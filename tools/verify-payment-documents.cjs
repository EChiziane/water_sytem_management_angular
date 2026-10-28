const fs = require('node:fs');
const ts = require('typescript');
const assert = require('node:assert/strict');
require.extensions['.ts'] = (module, filename) => {
  module._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    compilerOptions: {module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true}
  }).outputText, filename);
};
const {buildPaymentDocument} = require('../src/app/core/utils/payment-document.ts');
const {referenceMonths, paymentDate, paymentQuantity, money} = require('../src/app/shared/utils/payment-presentation.ts');
const seed = JSON.parse(fs.readFileSync('public/data/dev/water-data.json', 'utf8'));
const payment = seed.payments[0];
assert.equal(referenceMonths('2026-08|| bad |2026-13').length, 3);
assert.equal(referenceMonths('2026-13')[0], '2026-13');
assert.equal(paymentDate('bad'), 'Não informada');
assert.equal(paymentQuantity({...payment, numMonths: 0, referenceMonth: '2026-08|2026-09'}), 2);
assert.ok(money(12345.67).includes('MT'));
fs.mkdirSync('output/pdf', {recursive: true});
fs.mkdirSync('tmp/pdfs', {recursive: true});
for (const [kind, filename] of [['receipt','recibo-exemplo'],['statement','demonstrativo-exemplo']]) {
  const doc = buildPaymentDocument(payment, {kind, issuedAt: '2026-10-28T10:00:00+02:00'});
  assert.equal(doc.getNumberOfPages(), 1);
  fs.writeFileSync(`output/pdf/${filename}.pdf`, Buffer.from(doc.output('arraybuffer')));
}
const longPayment = {...payment, confirmed: false,
  referenceMonth: Array.from({length: 240}, (_,i) => `${2000 + Math.floor(i/12)}-${String(i%12+1).padStart(2,'0')}`).join('|'),
  customerName: 'Empresa de distribuição e serviços '.repeat(10),
  customerAddress: 'Avenida da Independência, edifício comercial, piso 2, Maputo. '.repeat(8),
  id: 'operation-long-reference-'.repeat(7),
  createdByName: 'Operador de tesouraria '.repeat(8)
};
const stress = buildPaymentDocument(longPayment, {issuedAt: '2026-10-28T10:00:00+02:00'});
assert.ok(stress.getNumberOfPages() > 1);
fs.writeFileSync('tmp/pdfs/registo-longo.pdf', Buffer.from(stress.output('arraybuffer')));
console.log('Document checks passed: confirmed receipt, statement, pending multi-page record, invalid dates and reference periods.');
