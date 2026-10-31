import {PermissionService} from '@core/auth/permission.service';
import {CompanyProfileService} from './company-profile.service';
import {NzMessageService} from 'ng-zorro-antd/message';
import {TranslationService} from './translation.service';
import type {CompanyProfile} from '@shared/models/company-profile';
import {Injectable} from '@angular/core';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

import {DocumentFilenameService} from '@core/services/document-filename.service';
import {WaterLocalDataService} from '@core/services/water-local-data.service';
import {MONTH_NAMES_PT} from '@shared/constants/app-labels';
import {Customer} from '@shared/models/WSM/customer';
import {Payment} from '@shared/models/WSM/payment';

type AutoTable = typeof autoTable;

export interface DashboardReportData {
  customers: Customer[];
  payments: Payment[];
  activeCustomers: number;
  customersWithDebt: number;
  paidThisMonth: number;
  totalDebt: number;
  recentPayments: Payment[];
  topDebtors: Array<Customer & { debtAmount: number }>;
}

@Injectable({
  providedIn: 'root'
})
export class WaterReportPdfService {
  constructor(private permissions: PermissionService, private companyProfiles: CompanyProfileService, private messages: NzMessageService, private translations: TranslationService,
    private filenames: DocumentFilenameService,
    private localData: WaterLocalDataService
  ) {
  }

  downloadCustomerList(customers: Customer[], scopeLabel = 'Lista filtrada'): void {
    this.permissions.require('reports.financial');
    this.companyProfiles.getIssuerProfile().subscribe({next:company=>{
    const doc = new jsPDF({orientation: 'portrait'});
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 14;

    this.drawHeader(doc, 'LISTA DE CLIENTES', scopeLabel, company);
    this.drawSummaryTable(doc, autoTable, margin, 26, [
      ['Clientes', String(customers.length)],
      ['Ativos', String(customers.filter(customer => this.isActiveCustomer(customer)).length)],
      ['Com divida', String(customers.filter(customer => Number(customer.monthsInDebt || 0) > 0).length)]
    ]);

    autoTable(doc, {
      startY: 44,
      margin: {left: margin, right: margin, bottom: 20},
      head: [['Codigo', 'Cliente', 'Contacto', 'Endereco', 'Valvula', 'Meses', 'Divida']],
      body: customers.map(customer => [
        customer.code || '-',
        customer.name || '-',
        customer.contact || '-',
        customer.address || '-',
        String(customer.valve || '-'),
        String(customer.monthsInDebt || 0),
        `${this.money(Number(customer.monthlyFee || 0) * Number(customer.monthsInDebt || 0))} MT`
      ]),
      theme: 'grid',
      styles: this.tableStyles(),
      headStyles: this.headStyles(),
      didDrawPage: () => this.drawFooter(doc, pageWidth, pageHeight)
    });

    doc.save(this.filenames.build('CLIENTES', 'LISTA'));

    },error:()=>this.messages.error(this.translations.instant('company.documentError'))});
  }

  downloadPaymentList(payments: Payment[], scopeLabel = 'Lista filtrada'): void {
    this.permissions.require('reports.financial');
    this.companyProfiles.getIssuerProfile().subscribe({next:company=>{
    const doc = new jsPDF({orientation: 'portrait'});
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 14;
    const total = payments.reduce((sum, payment) => sum + Number(payment.amount || 0), 0);

    this.drawHeader(doc, 'LISTA DE PAGAMENTOS', scopeLabel, company);
    this.drawSummaryTable(doc, autoTable, margin, 26, [
      ['Pagamentos', String(payments.length)],
      ['Confirmados', String(payments.filter(payment => payment.confirmed).length)],
      ['Total', `${this.money(total)} MT`]
    ]);

    autoTable(doc, {
      startY: 44,
      margin: {left: margin, right: margin, bottom: 20},
      head: [['Recibo', 'Cliente', 'Meses', 'Metodo', 'Data', 'Valor']],
      body: payments.map(payment => [
        payment.referenceCode || '-',
        payment.customerName || '-',
        this.formatReferenceMonths(payment.referenceMonth),
        payment.paymentMethod || '-',
        this.formatDate(payment.paymentDate),
        `${this.money(payment.amount)} MT`
      ]),
      theme: 'grid',
      styles: this.tableStyles(),
      headStyles: this.headStyles(),
      columnStyles: {
        2: {cellWidth: 38},
        5: {halign: 'right'}
      },
      didDrawPage: () => this.drawFooter(doc, pageWidth, pageHeight)
    });

    doc.save(this.filenames.build('PAGAMENTOS', 'LISTA'));

    },error:()=>this.messages.error(this.translations.instant('company.documentError'))});
  }

  downloadDashboardReport(data: DashboardReportData): void {
    this.permissions.require('reports.financial');
    this.companyProfiles.getIssuerProfile().subscribe({next:company=>{
    const doc = new jsPDF({orientation: 'portrait'});
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 14;

    this.drawHeader(doc, 'RELATORIO DO DASHBOARD', 'Resumo operacional', company);
    this.drawSummaryTable(doc, autoTable, margin, 26, [
      ['Clientes', String(data.customers.length)],
      ['Ativos', String(data.activeCustomers)],
      ['Com divida', String(data.customersWithDebt)],
      ['Recebido mes', `${this.money(data.paidThisMonth)} MT`],
      ['Divida', `${this.money(data.totalDebt)} MT`]
    ]);

    autoTable(doc, {
      startY: 48,
      margin: {left: margin, right: margin, bottom: 20},
      head: [['Maior devedor', 'Contacto', 'Meses', 'Valor']],
      body: data.topDebtors.length ? data.topDebtors.map(customer => [
        customer.name || '-',
        customer.contact || '-',
        String(customer.monthsInDebt || 0),
        `${this.money(customer.debtAmount)} MT`
      ]) : [['-', '-', '-', '-']],
      theme: 'grid',
      styles: this.tableStyles(),
      headStyles: this.headStyles(),
      didDrawPage: () => this.drawFooter(doc, pageWidth, pageHeight)
    });

    autoTable(doc, {
      startY: ((doc as any).lastAutoTable?.finalY || 90) + 8,
      margin: {left: margin, right: margin, bottom: 20},
      head: [['Pagamento recente', 'Meses', 'Metodo', 'Data', 'Valor']],
      body: data.recentPayments.length ? data.recentPayments.map(payment => [
        payment.customerName || '-',
        this.formatReferenceMonths(payment.referenceMonth),
        payment.paymentMethod || '-',
        this.formatDate(payment.paymentDate),
        `${this.money(payment.amount)} MT`
      ]) : [['-', '-', '-', '-', '-']],
      theme: 'grid',
      styles: this.tableStyles(),
      headStyles: this.headStyles(),
      didDrawPage: () => this.drawFooter(doc, pageWidth, pageHeight)
    });

    doc.save(this.filenames.build('DASHBOARD', 'RELATORIO'));

    },error:()=>this.messages.error(this.translations.instant('company.documentError'))});
  }

  downloadLocalDatabase(format: 'json' | 'txt'): void {
    this.permissions.require('users.manage');
    const content = this.localData.exportState(format);
    const blob = new Blob([content], {type: format === 'json' ? 'application/json' : 'text/plain'});
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = this.filenames.build('BASE_LOCAL', format.toUpperCase(), format);
    link.click();
    URL.revokeObjectURL(url);
  }

  resetLocalDatabase(): void {
    this.localData.resetLocalData();
  }

  private drawHeader(doc: jsPDF, title: string, caption: string, company: CompanyProfile): void {
    const pageWidth = doc.internal.pageSize.getWidth();

    doc.setDrawColor(190, 198, 207);
    doc.line(14, 20, pageWidth - 14, 20);
    doc.setTextColor(20, 27, 35);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text(title, 14, 11);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(74, 85, 99);
    doc.text(caption || company.name, 14, 16);
    doc.text(`Emitido ${this.formatDateTime(new Date())}`, pageWidth - 14, 11, {align: 'right'});
    let companyFont=7.5;
    const availableWidth=pageWidth * 0.55;
    let companyLines=doc.splitTextToSize(company.name,availableWidth);
    while(companyLines.length>2 && companyFont>5){companyFont-=0.5;doc.setFontSize(companyFont);companyLines=doc.splitTextToSize(company.name,availableWidth);}
    doc.text(companyLines,pageWidth-14,16,{align:'right'});
  }

  private drawSummaryTable(
    doc: jsPDF,
    table: AutoTable,
    margin: number,
    startY: number,
    rows: Array<[string, string]>
  ): void {
    table(doc, {
      startY,
      margin: {left: margin, right: margin},
      body: [rows.flatMap(([label, value]) => [label, value || '-'])],
      theme: 'grid',
      styles: {
        fontSize: 7,
        cellPadding: 1.6,
        lineColor: [205, 213, 223],
        lineWidth: 0.15,
        textColor: [20, 27, 35],
        minCellHeight: 6
      },
      columnStyles: rows.reduce((styles, _, index) => {
        styles[String(index * 2)] = {fontStyle: 'bold', fillColor: [245, 247, 250]};
        return styles;
      }, {} as Record<string, Partial<import('jspdf-autotable').Styles>>)
    });
  }

  private drawFooter(doc: jsPDF, pageWidth: number, pageHeight: number): void {
    const pageNumber = doc.getCurrentPageInfo().pageNumber;

    doc.setDrawColor(223, 234, 240);
    doc.line(14, pageHeight - 14, pageWidth - 14, pageHeight - 14);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(99, 115, 129);
    doc.text('Water System Management | relatorio operacional', 14, pageHeight - 8);
    doc.text(`Pagina ${pageNumber} de ${doc.getNumberOfPages()}`, pageWidth - 14, pageHeight - 8, {align: 'right'});
  }

  private tableStyles(): Record<string, unknown> {
    return {
      fontSize: 7.2,
      cellPadding: 1.8,
      textColor: [20, 27, 35],
      lineColor: [205, 213, 223],
      lineWidth: 0.15,
      overflow: 'linebreak',
      valign: 'middle'
    };
  }

  private headStyles(): Record<string, unknown> {
    return {
      fillColor: [238, 242, 246],
      textColor: [20, 27, 35],
      fontStyle: 'bold'
    };
  }

  private isActiveCustomer(customer: Customer): boolean {
    return ['active', 'ativo'].includes((customer.status || '').toLowerCase());
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

    const [year, monthNumber] = month.includes('-') ? month.split('-') : ['', month];
    const monthName = MONTH_NAMES_PT[Number(monthNumber) - 1];

    if (!monthName) {
      return month;
    }

    return year ? `${monthName} ${year}` : monthName;
  }

  private formatDate(value: string | number | Date | null | undefined): string {
    if (!value) {
      return '-';
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return '-';
    }

    return `${this.pad(date.getDate())}/${this.pad(date.getMonth() + 1)}/${date.getFullYear()}`;
  }

  private formatDateTime(value: string | number | Date): string {
    const date = new Date(value);
    return `${this.pad(date.getDate())}/${this.pad(date.getMonth() + 1)}/${date.getFullYear()} ${this.pad(date.getHours())}:${this.pad(date.getMinutes())}`;
  }

  private money(value: number | null | undefined): string {
    return Number(value || 0).toFixed(2);
  }

  private pad(value: number): string {
    return String(value).padStart(2, '0');
  }
}
