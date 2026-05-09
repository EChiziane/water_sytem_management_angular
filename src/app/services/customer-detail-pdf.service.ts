import { Injectable } from '@angular/core';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

import { Customer } from '../models/WSM/customer';
import { Payment } from '../models/WSM/payment';

@Injectable({
  providedIn: 'root'
})
export class CustomerDetailPdfService {

  constructor() {}

  downloadCustomerReport(
    customer: Customer,
    payments: Payment[],
    includePayments: boolean = false
  ): void {

    const doc = new jsPDF();

    const pageWidth = doc.internal.pageSize.getWidth();

    const issueDate = this.formatDate(new Date());

    const totalDebt =
      (customer.monthlyFee || 0) *
      (customer.monthsInDebt || 0);

    const lastPayment =
      payments.length > 0
        ? this.formatDate(payments[0].paymentDate)
        : 'Sem pagamentos';

    // ===== HEADER =====

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(20);

    doc.text(
      'FICHA DO CLIENTE',
      14,
      20
    );

    // ===== EMPRESA =====

    doc.setFontSize(12);

    doc.text('ÁGUAS CHIZIANE', 14, 30);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);

    doc.text('Cumbeza, Rua da Esquadra 524', 14, 38);

    doc.text('Maputo - Moçambique', 14, 44);

    doc.text('Contacto: 846 955 890', 14, 50);

    doc.text('Email: aguaschiziane@gmail.com', 14, 56);

    doc.text(
      `Emitido em: ${issueDate}`,
      pageWidth - 14,
      30,
      { align: 'right' }
    );

    // ===== LINE =====

    doc.line(14, 62, pageWidth - 14, 62);

    // ===== CLIENT DATA =====

    doc.roundedRect(
      14,
      70,
      pageWidth - 28,
      60,
      3,
      3
    );

    doc.setFont('helvetica', 'bold');

    doc.text('Dados do Cliente', 18, 80);

    doc.setFont('helvetica', 'normal');

    doc.text(`Código: ${customer.code}`, 18, 92);

    doc.text(`Nome: ${customer.name}`, 18, 100);

    doc.text(`Contacto: ${customer.contact}`, 18, 108);

    doc.text(`Endereço: ${customer.address}`, 18, 116);

    doc.text(
      `Cliente desde: ${this.formatDate(customer.createdAt)}`,
      110,
      92
    );

    doc.text(`Status: ${customer.status}`, 110, 100);

    doc.text(`Válvula: ${customer.valve}`, 110, 108);

    doc.text(
      `Taxa mensal: ${this.money(customer.monthlyFee)} MT`,
      110,
      116
    );

    // ===== FINANCIAL =====

    doc.roundedRect(
      14,
      140,
      pageWidth - 28,
      44,
      3,
      3
    );

    doc.setFont('helvetica', 'bold');

    doc.text(
      'Situação Financeira',
      18,
      150
    );

    doc.setFont('helvetica', 'normal');

    doc.text(
      `Meses em dívida: ${customer.monthsInDebt}`,
      18,
      162
    );

    doc.text(
      `Total em dívida: ${this.money(totalDebt)} MT`,
      18,
      170
    );

    doc.text(
      `Último pagamento: ${lastPayment}`,
      110,
      162
    );

    doc.text(
      `Total pagamentos: ${payments.length}`,
      110,
      170
    );

    // ===== MONTHS =====

    const months =
      customer.unpaidMonths?.length
        ? customer.unpaidMonths.map(
          m => [this.formatMonth(m)]
        )
        : [['Sem dívidas']];

    autoTable(doc, {

      startY: 194,

      head: [['Meses em Dívida']],

      body: months,

      styles: {
        fontSize: 10
      },

      headStyles: {
        fillColor: [41, 128, 185]
      }
    });

    // ===== OPTIONAL PAYMENTS =====

    if (includePayments) {

      const paymentsTable = payments.map(payment => [

        payment.referenceCode || '-',

        `${this.money(payment.amount)} MT`,

        payment.paymentMethod || '-',

        payment.referenceMonth || '-',

        this.formatDate(payment.paymentDate)
      ]);

      autoTable(doc, {

        startY: (doc as any).lastAutoTable.finalY + 16,

        head: [[
          'Código',
          'Valor',
          'Método',
          'Referência',
          'Data'
        ]],

        body: paymentsTable,

        styles: {
          fontSize: 9
        },

        headStyles: {
          fillColor: [52, 73, 94]
        }
      });
    }

    // ===== FOOTER =====

    const finalY =
      includePayments
        ? (doc as any).lastAutoTable.finalY + 20
        : (doc as any).lastAutoTable.finalY + 20;

    doc.setFontSize(9);

    doc.setFont('helvetica', 'italic');

    doc.text(
      'Documento emitido automaticamente pelo sistema Águas Chiziane',
      14,
      finalY
    );

    doc.text(
      'Águas Chiziane – Água com qualidade, compromisso com a sua casa',
      14,
      finalY + 6
    );

    // ===== SAVE =====

    doc.save(
      `CLIENTE_${customer.code}.pdf`
    );
  }

  private money(value: number): string {

    return Number(value || 0).toFixed(2);
  }

  private formatDate(value: any): string {

    const date = new Date(value);

    return `${date.getDate()}/${
      date.getMonth() + 1
    }/${date.getFullYear()}`;
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
