import { Injectable } from '@angular/core';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

import { Customer } from '../../models/WSM/customer';
import { Payment } from '../../models/WSM/payment';

type MonthlyHistoryRow = {
  month: string;
  status: string;
  registeredBy: string;
  receipt: string;
  paymentDate: string;
  amount: string;
  method: string;
  sortKey: string;
};

@Injectable({
  providedIn: 'root'
})
export class CustomerDetailPdfService {

  downloadCustomerReport(
    customer: Customer,
    payments: Payment[],
    includeHistory: boolean = false
  ): void {
    const doc = new jsPDF({ orientation: 'landscape' });
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 14;
    const contentWidth = pageWidth - margin * 2;
    const issueDate = this.formatDate(new Date());
    const totalDebt = Number(customer.monthlyFee || 0) * Number(customer.monthsInDebt || 0);
    const lastPayment = payments.length > 0
      ? this.formatDate(payments[0].paymentDate)
      : 'Sem pagamentos';

    this.drawHeader(doc, 'Ficha do cliente', `Emitido em ${issueDate}`);

    this.drawMetricCard(doc, margin, 52, 78, 'Estado', customer.status || '-');
    this.drawMetricCard(doc, margin + 88, 52, 78, 'Meses em dívida', `${customer.monthsInDebt || 0}`);
    this.drawMetricCard(doc, margin + 176, 52, 78, 'Total em dívida', `${this.money(totalDebt)} MT`);

    this.drawSectionTitle(doc, 'Dados do cliente', margin, 92);
    this.drawInfoPanel(doc, margin, 98, contentWidth, [
      ['Código', customer.code || '-'],
      ['Nome', customer.name || '-'],
      ['Contacto', customer.contact || '-'],
      ['Endereço', customer.address || '-'],
      ['Cliente desde', this.formatDate(customer.createdAt)],
      ['Válvula', String(customer.valve || '-')],
      ['Taxa mensal', `${this.money(customer.monthlyFee)} MT`],
      ['Último pagamento', lastPayment]
    ]);

    if (includeHistory) {
      this.drawMonthlyHistory(doc, customer, payments, margin, contentWidth, 152);
    }

    this.drawFooter(doc);
    doc.save(`CLIENTE_${customer.code}.pdf`);
  }

  private drawMonthlyHistory(
    doc: jsPDF,
    customer: Customer,
    payments: Payment[],
    margin: number,
    contentWidth: number,
    startY: number
  ): void {
    this.drawSectionTitle(doc, 'Histórico dos meses', margin, startY - 6);

    const monthlyHistory = this.buildMonthlyHistory(customer, payments);
    const body = monthlyHistory.length
      ? monthlyHistory.map(row => [
        row.month,
        row.status,
        row.registeredBy,
        row.receipt,
        row.paymentDate,
        row.amount,
        row.method
      ])
      : [[
        '-',
        'Sem histórico',
        '-',
        '-',
        '-',
        '-',
        '-'
      ]];

    autoTable(doc, {
      startY,
      margin: { left: margin, right: margin },
      head: [[
        'Mês',
        'Estado',
        'Registrado por',
        'Recibo',
        'Data pagamento',
        'Valor',
        'Método'
      ]],
      body,
      styles: {
        cellPadding: 3,
        font: 'helvetica',
        fontSize: 8,
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
        0: { cellWidth: 42 },
        1: { cellWidth: 25 },
        2: { cellWidth: 42 },
        3: { cellWidth: 35 },
        4: { cellWidth: 31 },
        5: { cellWidth: 28, halign: 'right' },
        6: { cellWidth: contentWidth - 203 }
      }
    });
  }

  private buildMonthlyHistory(customer: Customer, payments: Payment[]): MonthlyHistoryRow[] {
    const rowsByMonth = new Map<string, MonthlyHistoryRow>();

    payments.forEach(payment => {
      const referenceMonths = this.splitReferenceMonths(payment.referenceMonth);
      const monthlyAmount = referenceMonths.length
        ? Number(payment.amount || 0) / referenceMonths.length
        : Number(payment.amount || 0);

      referenceMonths.forEach(month => {
        const sortKey = this.normalizeMonthKey(month);

        rowsByMonth.set(sortKey, {
          month: this.formatMonth(month),
          status: payment.confirmed ? 'Pago' : 'Pendente',
          registeredBy: payment.createdByName || '-',
          receipt: payment.referenceCode || '-',
          paymentDate: this.formatDate(payment.paymentDate),
          amount: `${this.money(monthlyAmount)} MT`,
          method: payment.paymentMethod || '-',
          sortKey
        });
      });
    });

    customer.unpaidMonths?.forEach(month => {
      const sortKey = this.normalizeMonthKey(month);

      if (rowsByMonth.has(sortKey)) {
        return;
      }

      rowsByMonth.set(sortKey, {
        month: this.formatMonth(month),
        status: 'Em dívida',
        registeredBy: '-',
        receipt: '-',
        paymentDate: '-',
        amount: `${this.money(customer.monthlyFee)} MT`,
        method: '-',
        sortKey
      });
    });

    return Array.from(rowsByMonth.values())
      .sort((current, next) => next.sortKey.localeCompare(current.sortKey));
  }

  private drawHeader(doc: jsPDF, title: string, caption: string): void {
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
    doc.text('Cumbeza, Rua da Esquadra 524 - Maputo, Moçambique', 14, 34);
    doc.text('Contacto: 846 955 890 - Email: aguaschiziane@gmail.com', 14, 39);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(255, 255, 255);
    doc.text(caption, pageWidth - 14, 20, { align: 'right' });
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
    doc.roundedRect(x, y, width, 42, 3, 3, 'FD');

    rows.forEach(([label, value], index) => {
      const column = index % 4;
      const row = Math.floor(index / 4);
      const columnWidth = width / 4;
      const itemX = x + 6 + column * columnWidth;
      const itemY = y + 10 + row * 18;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(99, 115, 129);
      doc.text(label, itemX, itemY);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(41, 55, 70);
      doc.text(doc.splitTextToSize(value, columnWidth - 12), itemX, itemY + 5);
    });
  }

  private drawFooter(doc: jsPDF): void {
    const pageCount = doc.getNumberOfPages();

    for (let page = 1; page <= pageCount; page += 1) {
      doc.setPage(page);

      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();

      doc.setDrawColor(224, 231, 239);
      doc.line(14, pageHeight - 18, pageWidth - 14, pageHeight - 18);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(99, 115, 129);
      doc.text('Documento emitido automaticamente pelo sistema Águas Chiziane', 14, pageHeight - 10);

      doc.setFont('helvetica', 'italic');
      doc.text('Águas Chiziane - água com qualidade, compromisso com a sua casa', pageWidth - 14, pageHeight - 10, {
        align: 'right'
      });
    }
  }

  private money(value: number): string {
    return Number(value || 0).toFixed(2);
  }

  private formatDate(value: string | number | Date | null | undefined): string {
    if (!value) {
      return '-';
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return '-';
    }

    return `${this.padDate(date.getDate())}/${this.padDate(date.getMonth() + 1)}/${date.getFullYear()}`;
  }

  private splitReferenceMonths(reference: string | null | undefined): string[] {
    if (!reference) {
      return [];
    }

    return reference
      .split('|')
      .map(month => month.trim())
      .filter(Boolean);
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

  private normalizeMonthKey(month: string): string {
    if (!month) {
      return '0000-00';
    }

    const [year, monthNumber] = month.includes('-')
      ? month.split('-')
      : ['0000', month];

    return `${year || '0000'}-${String(Number(monthNumber || 0)).padStart(2, '0')}`;
  }

  private padDate(value: number): string {
    return String(value).padStart(2, '0');
  }
}
