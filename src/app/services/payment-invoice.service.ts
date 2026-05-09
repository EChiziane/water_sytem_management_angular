import {Injectable} from '@angular/core';
import autoTable from 'jspdf-autotable';
import {Payment} from '../models/WSM/payment';
import jsPDF from 'jspdf';

@Injectable({
  providedIn: 'root'
})
export class PaymentInvoiceService {

  constructor() {}

  downloadPaymentInvoice(payment: Payment): void {

    const doc = new jsPDF();

    const pageWidth = doc.internal.pageSize.getWidth();

    // ===== DATAS =====

    const paymentDate =
      new Date(payment.paymentDate || new Date());

    const issueDate = new Date();

    const formattedPaymentDate =
      this.formatDateOnly(
        paymentDate.toISOString()
      );

    const formattedIssueDate =
      this.formatDateOnly(
        issueDate.toISOString()
      );

    // ===== VALORES =====

    const amount =
      Number(payment.amount || 0);

    const numMonths =
      Number(payment.numMonths || 1);

    const monthlyFee =
      Number(payment.monthlyFee || 0);

    // ===== FORMAT MONTHS =====

    const monthsText =
      this.formatReferenceMonths(
        payment.referenceMonth || ''
      );

    // ===== HEADER =====

    doc.setFont('helvetica', 'bold');

    doc.setFontSize(18);

    doc.text(
      'RECIBO DE PAGAMENTO DE ÁGUA',
      14,
      18
    );

    // ===== EMPRESA =====

    doc.setFontSize(12);

    doc.text(
      'ÁGUAS CHIZIANE',
      14,
      26
    );

    doc.setFont('helvetica', 'normal');

    doc.setFontSize(10);

    doc.text(
      'Cumbeza, Rua da Esquadra 524',
      14,
      32
    );

    doc.text(
      'Maputo - Moçambique',
      14,
      38
    );

    doc.text(
      'Contacto: 846 955 890',
      14,
      44
    );

    doc.text(
      'Email: aguaschiziane@gmail.com',
      14,
      50
    );

    doc.text(
      'NUIT: 123456789',
      14,
      56
    );

    // ===== INFO DIREITA =====

    doc.setFontSize(10);

    doc.text(
      `Data de Pagamento: ${formattedPaymentDate}`,
      pageWidth - 14,
      26,
      {align: 'right'}
    );

    doc.text(
      `Data de Emissão: ${formattedIssueDate}`,
      pageWidth - 14,
      32,
      {align: 'right'}
    );

    doc.setFont('helvetica', 'bold');

    doc.text(
      `Recibo Nº: ${payment.referenceCode || 'N/A'}`,
      pageWidth - 14,
      38,
      {align: 'right'}
    );

    doc.setFont('helvetica', 'normal');

    doc.text(
      `Emitido por: ${payment.createdByName || 'Sistema'}`,
      pageWidth - 14,
      44,
      {align: 'right'}
    );

    // ===== LINHA =====

    doc.line(
      14,
      62,
      pageWidth - 14,
      62
    );

    // ===== CLIENTE =====

    doc.roundedRect(
      14,
      68,
      pageWidth - 28,
      45,
      3,
      3
    );

    doc.setFont('helvetica', 'bold');

    doc.text(
      'Dados do Cliente',
      16,
      76
    );

    doc.setFont('helvetica', 'normal');

    doc.text(
      `Nome: ${payment.customerName || '-'}`,
      16,
      84
    );

    doc.text(
      `Contacto: ${payment.customerContact || '-'}`,
      16,
      90
    );

    doc.text(
      `Localização: ${payment.customerAddress || '-'}`,
      16,
      96
    );

    doc.text(
      `Válvula: ${payment.customerValve || '-'}`,
      16,
      102
    );

    doc.text(
      `Taxa mensal: ${this.formatMoney(monthlyFee)} Mts`,
      16,
      108
    );

    // ===== DESCRIÇÃO =====

    const descricao =
      `Pagamento referente aos meses: ${monthsText}. ` +
      `Total: ${this.formatMoney(amount)} Mts.`;

    const splitText =
      doc.splitTextToSize(
        descricao,
        pageWidth - 28
      );

    doc.roundedRect(
      14,
      118,
      pageWidth - 28,
      45,
      3,
      3
    );

    doc.setFont('helvetica', 'bold');

    doc.text(
      'Descrição',
      16,
      126
    );

    doc.setFont('helvetica', 'normal');

    doc.text(
      splitText,
      16,
      134
    );

    // ===== TABELA =====

    autoTable(doc, {

      startY: 166,

      head: [[
        'Meses Pagos',
        'Qtd',
        'Valor'
      ]],

      body: [[
        monthsText,
        numMonths,
        `${this.formatMoney(amount)} Mts`
      ]],

      styles: {
        fontSize: 10
      },

      headStyles: {
        fillColor: [41, 128, 185]
      }
    });

    const finalY =
      (doc as any).lastAutoTable.finalY || 190;

    // ===== TOTAL =====

    doc.setFont('helvetica', 'bold');

    doc.setFontSize(12);

    doc.text(
      `Total Pago: ${this.formatMoney(amount)} Mts`,
      14,
      finalY + 12
    );

    // ===== FOOTER =====

    const footerY = finalY + 25;

    doc.setFont('helvetica', 'normal');

    doc.setFontSize(9);

    doc.text(
      'Documento emitido por computador - não necessita de assinatura',
      14,
      footerY
    );

    doc.setFont('helvetica', 'italic');

    doc.text(
      'Águas Chiziane – Água com qualidade, compromisso com a sua casa',
      14,
      footerY + 6
    );

    // ===== SAVE =====

    doc.save(
      `RECIBO_${payment.referenceCode || payment.id}.pdf`
    );
  }

  private formatDateOnly(value: string): string {

    const date = new Date(value);

    return `${date.getDate()}/${
      date.getMonth() + 1
    }/${date.getFullYear()}`;
  }

  private formatMoney(value: number): string {

    return Number(value || 0).toFixed(2);
  }

  private formatReferenceMonths(reference: string): string {

    if (!reference) return '';

    return reference
      .split('|')
      .map(month =>
        this.formatMonth(month.trim())
      )
      .join(' | ');
  }

  private formatMonth(month: string): string {

    const [year, monthNumber] = month.split('-');

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

    return `${monthNames[Number(monthNumber) - 1]} ${year}`;
  }
}
