import { Injectable } from '@angular/core';
import autoTable from 'jspdf-autotable';
import jsPDF from 'jspdf';

import { Payment } from '../../models/WSM/payment';

type AutoTableDocument = jsPDF & {
  lastAutoTable?: {
    finalY: number;
  };
};

@Injectable({
  providedIn: 'root'
})
export class PaymentInvoiceService {

  downloadPaymentInvoice(payment: Payment): void {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 14;
    const contentWidth = pageWidth - margin * 2;

    const amount = Number(payment.amount || 0);
    const numMonths = Number(payment.numMonths || 1);
    const monthlyFee = Number(payment.monthlyFee || 0);
    const monthsText = this.formatReferenceMonths(payment.referenceMonth);
    const paymentDate = this.formatDateOnly(payment.paymentDate);
    const issueDate = this.formatDateOnly(new Date());

    this.drawHeader(
      doc,
      'Recibo de pagamento',
      `Recibo Nº ${payment.referenceCode || 'N/A'}`,
      issueDate
    );

    this.drawMetricCard(doc, margin, 52, 56, 'Total pago', `${this.formatMoney(amount)} MT`);
    this.drawMetricCard(doc, margin + 62, 52, 50, 'Meses pagos', `${numMonths}`);
    this.drawMetricCard(doc, margin + 118, 52, 64, 'Pagamento', payment.paymentMethod || '-');

    this.drawSectionTitle(doc, 'Dados do cliente', margin, 92);
    this.drawInfoPanel(doc, margin, 98, contentWidth, [
      ['Nome', payment.customerName || '-'],
      ['Contacto', payment.customerContact || '-'],
      ['Localização', payment.customerAddress || '-'],
      ['Válvula', String(payment.customerValve || '-')],
      ['Taxa mensal', `${this.formatMoney(monthlyFee)} MT`],
      ['Data de pagamento', paymentDate]
    ]);

    this.drawSectionTitle(doc, 'Resumo do pagamento', margin, 146);

    autoTable(doc, {
      startY: 152,
      margin: { left: margin, right: margin },
      head: [[
        'Meses pagos',
        'Qtd.',
        'Valor'
      ]],
      body: [[
        monthsText,
        `${numMonths}`,
        `${this.formatMoney(amount)} MT`
      ]],
      styles: {
        cellPadding: 4,
        font: 'helvetica',
        fontSize: 9,
        lineColor: [224, 231, 239],
        lineWidth: 0.2,
        overflow: 'linebreak',
        textColor: [41, 55, 70],
        valign: 'middle'
      },
      headStyles: {
        fillColor: [12, 37, 56],
        fontStyle: 'bold',
        textColor: [255, 255, 255]
      },
      alternateRowStyles: {
        fillColor: [248, 251, 253]
      },
      columnStyles: {
        0: { cellWidth: contentWidth - 72 },
        1: { cellWidth: 24, halign: 'center' },
        2: { cellWidth: 48, halign: 'right' }
      }
    });

    const finalY = (doc as AutoTableDocument).lastAutoTable?.finalY || 174;
    const description = `Pagamento referente a ${monthsText}. Documento emitido por ${payment.createdByName || 'Sistema'}.`;

    doc.setFillColor(240, 247, 250);
    doc.roundedRect(margin, finalY + 12, contentWidth, 26, 3, 3, 'F');
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(70, 86, 102);
    doc.text(doc.splitTextToSize(description, contentWidth - 10), margin + 5, finalY + 22);

    doc.setFillColor(12, 37, 56);
    doc.roundedRect(pageWidth - margin - 64, finalY + 48, 64, 22, 3, 3, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(176, 230, 222);
    doc.text('TOTAL PAGO', pageWidth - margin - 59, finalY + 57);
    doc.setFontSize(13);
    doc.setTextColor(255, 255, 255);
    doc.text(`${this.formatMoney(amount)} MT`, pageWidth - margin - 5, finalY + 66, { align: 'right' });

    this.drawFooter(doc);

    doc.save(`RECIBO_${payment.referenceCode || payment.id}.pdf`);
  }

  private drawHeader(doc: jsPDF, title: string, reference: string, issueDate: string): void {
    const pageWidth = doc.internal.pageSize.getWidth();

    doc.setFillColor(12, 37, 56);
    doc.rect(0, 0, pageWidth, 42, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.setTextColor(255, 255, 255);
    doc.text('Águas Chiziane', 14, 16);

    doc.setFontSize(10);
    doc.setTextColor(176, 230, 222);
    doc.text(title, 14, 26);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(219, 231, 236);
    doc.text('Cumbeza, Rua da Esquadra 524 · Maputo - Moçambique', 14, 34);
    doc.text('Contacto: 846 955 890 · Email: aguaschiziane@gmail.com · NUIT: 123456789', 14, 39);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(255, 255, 255);
    doc.text(reference, pageWidth - 14, 18, { align: 'right' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(219, 231, 236);
    doc.text(`Emitido em ${issueDate}`, pageWidth - 14, 28, { align: 'right' });
  }

  private drawMetricCard(doc: jsPDF, x: number, y: number, width: number, label: string, value: string): void {
    doc.setFillColor(248, 251, 253);
    doc.setDrawColor(224, 231, 239);
    doc.roundedRect(x, y, width, 26, 3, 3, 'FD');

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(99, 115, 129);
    doc.text(label, x + 5, y + 9);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(12, 37, 56);
    doc.text(doc.splitTextToSize(value, width - 10), x + 5, y + 18);
  }

  private drawSectionTitle(doc: jsPDF, title: string, x: number, y: number): void {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(12, 37, 56);
    doc.text(title, x, y);
  }

  private drawInfoPanel(doc: jsPDF, x: number, y: number, width: number, rows: Array<[string, string]>): void {
    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(224, 231, 239);
    doc.roundedRect(x, y, width, 36, 3, 3, 'FD');

    rows.forEach(([label, value], index) => {
      const column = index % 2;
      const row = Math.floor(index / 2);
      const itemX = x + 6 + column * (width / 2);
      const itemY = y + 9 + row * 10;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(99, 115, 129);
      doc.text(label, itemX, itemY);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(41, 55, 70);
      doc.text(doc.splitTextToSize(value, width / 2 - 12), itemX, itemY + 5);
    });
  }

  private drawFooter(doc: jsPDF): void {
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    doc.setDrawColor(224, 231, 239);
    doc.line(14, pageHeight - 22, pageWidth - 14, pageHeight - 22);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(99, 115, 129);
    doc.text('Documento emitido por computador - não necessita de assinatura', 14, pageHeight - 14);

    doc.setFont('helvetica', 'italic');
    doc.text('Águas Chiziane - água com qualidade, compromisso com a sua casa', pageWidth - 14, pageHeight - 14, {
      align: 'right'
    });
  }

  private formatDateOnly(value: string | number | Date | null | undefined): string {
    if (!value) {
      return '-';
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return '-';
    }

    return `${this.padDate(date.getDate())}/${this.padDate(date.getMonth() + 1)}/${date.getFullYear()}`;
  }

  private formatMoney(value: number): string {
    return Number(value || 0).toFixed(2);
  }

  private formatReferenceMonths(reference: string | null | undefined): string {
    if (!reference) {
      return '-';
    }

    const months = reference
      .split('|')
      .map(month => this.formatMonth(month.trim()))
      .filter(Boolean);

    return months.length ? months.join(', ') : '-';
  }

  private formatMonth(month: string): string {
    if (!month) {
      return '';
    }

    const [year, monthNumber] = month.includes('-')
      ? month.split('-')
      : ['', month];

    const monthNames = [
      'Janeiro',
      'Fevereiro',
      'Março',
      'Abril',
      'Maio',
      'Junho',
      'Julho',
      'Agosto',
      'Setembro',
      'Outubro',
      'Novembro',
      'Dezembro'
    ];

    const monthName = monthNames[Number(monthNumber) - 1];

    if (!monthName) {
      return month;
    }

    return year ? `${monthName} ${year}` : monthName;
  }

  private padDate(value: number): string {
    return String(value).padStart(2, '0');
  }
}
