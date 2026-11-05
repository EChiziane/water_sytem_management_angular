import type { CompanyProfile } from '../../../../shared/models/company-profile';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { Payment } from '../../../../shared/models/payment';
import { COMPANY_PROFILE } from '../../../../shared/config/company-profile';
import {
  money,
  paymentDate,
  paymentMethodLabel,
  paymentQuantity,
  referenceMonths,
} from '../../../../shared/utils/payment-presentation';

export interface PaymentDocumentOptions {
  company?: CompanyProfile;
  kind?: 'receipt' | 'statement';
  reference?: string;
  issuedAt?: string | Date;
}

/** Builds the same document for every download entry point. Does not mutate payment data. */
export function buildPaymentDocument(
  payment: Payment,
  options: PaymentDocumentOptions = {},
): jsPDF {
  const company = options.company || COMPANY_PROFILE;
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const ink: [number, number, number] = [23, 43, 53];
  const teal: [number, number, number] = [14, 124, 114];
  const muted: [number, number, number] = [95, 112, 122];
  const line: [number, number, number] = [221, 229, 232];
  const margin = 18;
  const width = 174;
  const reference = options.reference || payment.referenceCode || payment.id || 'Sem referência';
  const statement = options.kind === 'statement';
  const confirmed = payment.confirmed === true;
  const title = statement
    ? 'DEMONSTRATIVO DE FATURAÇÃO'
    : confirmed
      ? 'RECIBO DE PAGAMENTO'
      : 'REGISTO DE PAGAMENTO';
  const status = confirmed ? 'CONFIRMADO' : 'AGUARDA CONFIRMAÇÃO';
  const months = referenceMonths(payment.referenceMonth);
  let y = 0;

  function text(value: string, x: number, top: number, size = 9, bold = false, color = ink): void {
    doc.setFont('helvetica', bold ? 'bold' : 'normal');
    doc.setFontSize(size);
    doc.setTextColor(...color);
    doc.text(value, x, top);
  }
  function paragraph(
    value: string,
    x: number,
    top: number,
    availableWidth: number,
    size = 9,
    bold = false,
  ): number {
    doc.setFont('helvetica', bold ? 'bold' : 'normal');
    doc.setFontSize(size);
    const lines = doc.splitTextToSize(value, availableWidth) as string[];
    text(lines.join('\n'), x, top, size, bold);
    return lines.length * size * 0.3528 * 1.15;
  }
  function header(): void {
    doc.setFillColor(...teal);
    doc.rect(0, 0, 210, 3, 'F');
    let top = 17 + paragraph(company.name, margin, 17, width, 16, true) + 2;
    text('SERVIÇOS DE ABASTECIMENTO DE ÁGUA', margin, top, 8, false, muted);
    top += 8;
    for (const value of [
      company.address,
      `Tel. ${company.contact}  |  ${company.email}`,
      `NUIT: ${company.nuit}`,
    ]) {
      top += paragraph(value, margin, top, width, 8) + 1;
    }
    y = Math.max(53, top + 3);
    doc.setDrawColor(...line);
    doc.line(margin, y, margin + width, y);
    y += 10;
    text(title, margin, y, 12, true, teal);
    y += 8;
    y += paragraph(reference, margin, y, width - 62, 11, true);
    text(`Pagamento: ${paymentDate(payment.paymentDate)}`, 132, y - 4, 8, false, muted);
    text(`Emissão: ${paymentDate(options.issuedAt || new Date())}`, 132, y + 1, 8, false, muted);
    y += 10;
  }
  function ensureRoom(height: number): void {
    if (y + height <= 267) return;
    doc.addPage();
    header();
  }
  function note(label: string, value: string): void {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    const lines = doc.splitTextToSize(value, width) as string[];
    ensureRoom(12);
    text(label, margin, y, 8, true, muted);
    y += 6;
    for (const part of lines) {
      ensureRoom(6);
      text(part, margin, y);
      y += 4.5;
    }
    y += 6;
  }
  header();
  const customerRows = [
    ['CLIENTE', payment.customerName || 'Não informado'],
    ['MORADA', payment.customerAddress || 'Não informada'],
    ['CONTACTO', payment.customerContact || 'Não informado'],
    [
      payment.customerCode ? 'CONTA / VÁLVULA' : 'VÁLVULA',
      payment.customerCode
        ? `${payment.customerCode} / ${payment.customerValve ?? '-'}`
        : String(payment.customerValve ?? 'Não informada'),
    ],
  ];
  autoTable(doc, {
    startY: y,
    margin: { left: margin, right: margin, top: 82, bottom: 30 },
    theme: 'plain',
    body: customerRows,
    styles: {
      font: 'helvetica',
      fontSize: 9,
      textColor: ink,
      cellPadding: 3,
      overflow: 'linebreak',
    },
    columnStyles: { 0: { cellWidth: 38, textColor: muted, fontSize: 8 }, 1: { fontStyle: 'bold' } },
    willDrawPage: (data) => {
      if (data.pageNumber > 1) header();
    },
  });
  y = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;
  ensureRoom(35);
  text('DISCRIMINAÇÃO DO SERVIÇO', margin, y, 9, true);
  y += 5;
  autoTable(doc, {
    startY: y,
    margin: { left: margin, right: margin, top: 82, bottom: 30 },
    theme: 'grid',
    head: [['Descrição', 'Meses', 'Taxa mensal', 'Valor registado']],
    body: [
      [
        'Abastecimento de água / mensalidades',
        String(paymentQuantity(payment) || '-'),
        money(payment.monthlyFee),
        money(payment.amount),
      ],
    ],
    styles: {
      font: 'helvetica',
      fontSize: 9,
      cellPadding: 4,
      textColor: ink,
      lineColor: line,
      lineWidth: 0.2,
      overflow: 'linebreak',
    },
    headStyles: { fillColor: ink, textColor: [255, 255, 255], fontSize: 8, fontStyle: 'bold' },
    columnStyles: {
      0: { cellWidth: 73 },
      1: { cellWidth: 17, halign: 'center' },
      2: { cellWidth: 40, halign: 'right' },
      3: { cellWidth: 44, halign: 'right' },
    },
    willDrawPage: (data) => {
      if (data.pageNumber > 1) header();
    },
  });
  y = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 9;
  note('PERÍODOS DE REFERÊNCIA', months.join(' · ') || 'Não informados');
  ensureRoom(35);
  doc.setFillColor(241, 248, 247);
  doc.rect(margin, y, width, 27, 'F');
  text(
    statement ? 'VALOR DO REGISTO' : confirmed ? 'TOTAL RECEBIDO' : 'VALOR POR CONFIRMAR',
    margin + 5,
    y + 8,
    8,
    true,
    teal,
  );
  text(money(payment.amount), margin + 5, y + 20, 20, true);
  text(status, 124, y + 9, 8, true, confirmed ? teal : [158, 94, 22]);
  paragraph(paymentMethodLabel(payment.paymentMethod), 124, y + 17, 62, 10, true);
  y += 38;
  note(
    'REGISTO E RASTREABILIDADE',
    `Registado por: ${payment.createdByName || 'Não informado'}. Referência da operação: ${payment.referenceCode || reference}.`,
  );
  if (Number(payment.tax))
    note(
      'INFORMAÇÃO TRIBUTÁRIA DO REGISTO',
      `IVA registado: ${money(payment.tax)}. Taxa e base tributável não discriminadas no registo de origem.`,
    );
  note(
    'OBSERVAÇÕES',
    statement
      ? 'Demonstrativo associado ao pagamento acima identificado. Não substitui uma fatura fiscal nem cria uma nova cobrança.'
      : confirmed
        ? 'Este recibo documenta exclusivamente o pagamento identificado. A situação global da conta do cliente deve ser consultada no respetivo extrato.'
        : 'Pagamento ainda não confirmado. Este documento é um registo de operação e não comprova o recebimento do valor.',
  );

  const count = doc.getNumberOfPages();
  for (let page = 1; page <= count; page++) {
    doc.setPage(page);
    doc.setDrawColor(...line);
    doc.line(margin, 278, 192, 278);
    text(doc.splitTextToSize(company.name, 105)[0], margin, 284, 8, true, muted);
    text('Documento gerado eletronicamente', margin, 289, 7, false, muted);
    doc.setFontSize(8);
    doc.text(`Página ${page} de ${count}`, 192, 285, { align: 'right' });
  }
  doc.setProperties({
    title: `${title} - ${reference}`,
    author: company.name,
    subject: 'Serviços de abastecimento de água',
  });
  return doc;
}
