const fs = require('node:fs');
const ts = require('typescript');
const assert = require('node:assert/strict');
require.extensions['.ts'] = (module, filename) =>
  module._compile(
    ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2022,
        esModuleInterop: true,
      },
    }).outputText,
    filename,
  );
const {
  buildCustomerDocument,
} = require('../../src/app/core/services/documents/templates/customer-document.ts');
const seed = JSON.parse(fs.readFileSync('public/data/dev/water-data.json', 'utf8'));
fs.mkdirSync('output/pdf', { recursive: true });
fs.mkdirSync('tmp/pdfs', { recursive: true });
const customer = { ...seed.customers[0], unpaidMonths: ['2026-09', '2026-10'], monthsInDebt: 2 };
const payments = seed.payments.filter((payment) => payment.customerId === customer.id);
const options = { includeHistory: true, issuedAt: new Date('2026-10-29T10:00:00+02:00') };
const example = buildCustomerDocument(customer, payments, options);
assert.ok(Math.abs(example.internal.pageSize.getWidth() - 210) < 0.1);
assert.ok(Math.abs(example.internal.pageSize.getHeight() - 297) < 0.1);
assert.equal(example.getNumberOfPages(), 1);
fs.writeFileSync('output/pdf/ficha-cliente-a4.pdf', Buffer.from(example.output('arraybuffer')));
const longCustomer = {
  ...customer,
  name: 'Sociedade de Abastecimento e Gestão de Recursos Hídricos '.repeat(6),
  address: 'Avenida da Independência, edifício comercial, Maputo. '.repeat(10),
};
const longPayments = Array.from({ length: 65 }, (_, i) => ({
  ...payments[0],
  id: 'p' + i,
  referenceCode: 'REC-' + String(i).padStart(5, '0'),
  referenceMonth: `${2021 + Math.floor(i / 12)}-${String((i % 12) + 1).padStart(2, '0')}`,
  createdByName: 'Operador de Tesouraria '.repeat(3),
}));
const stress = buildCustomerDocument(longCustomer, longPayments, options);
assert.ok(stress.getNumberOfPages() > 2);
fs.writeFileSync('tmp/pdfs/cliente-historico-longo.pdf', Buffer.from(stress.output('arraybuffer')));
const summary = buildCustomerDocument(longCustomer, longPayments, {
  ...options,
  includeHistory: false,
});
assert.equal(summary.getNumberOfPages(), 1);
fs.writeFileSync('tmp/pdfs/cliente-resumo.pdf', Buffer.from(summary.output('arraybuffer')));
console.log(
  'Customer PDF checks passed: A4 portrait, one-page account, long fields, summary without history, multi-page history: ' +
    stress.getNumberOfPages() +
    ' pages.',
);
