import {OperationConfirmationService} from '@core/services/operation-confirmation.service';
import {tap} from 'rxjs';
import {
  Component,
  HostListener,
  Input,
  OnInit
} from '@angular/core';

import {
  FormBuilder,
  FormGroup,
  Validators
} from '@angular/forms';

import { ActivatedRoute, Router } from '@angular/router';
import {finalize} from 'rxjs';

import { NzMessageService } from 'ng-zorro-antd/message';
import { NzModalService, NzModalRef } from 'ng-zorro-antd/modal';

import { Customer } from '@shared/models/WSM/customer';
import { Payment } from '@shared/models/WSM/payment';


import { CustomerService } from '@core/services/customer.service';
import { PaymentService } from '@core/services/payment.service';
import { BillingService } from '@core/services/billing.service';

import { PaymentInvoiceService } from '@core/services/payment-invoice.service';
import { CustomerDetailPdfService } from '@core/services/customer-detail-pdf.service';
import {MonthlyCharge} from '@shared/models/monthly-charge';
import {MONTH_NAMES_PT} from '@shared/constants/app-labels';
import {money} from '@shared/utils/payment-presentation';
import {isOverdueMonth} from '@shared/utils/billing-recovery';

@Component({
  selector: 'app-customer-details',
  standalone: false,
  templateUrl: './customer-details.component.html',
  styleUrl: './customer-details.component.scss'
})
export class CustomerDetailsComponent implements OnInit {

  // =====================================================
  // INPUT
  // =====================================================

  @Input()
  customerId!: string;

  // =====================================================
  // MAIN DATA
  // =====================================================

  customer!: Customer;

  paymentForm!: FormGroup;

  debtMonths: string[] = [];

  selectedMonths: string[] = [];

  paymentDataSource: Payment[] = [];

  listOfDisplayData: Payment[] = [];

  monthlyTimeline: MonthlyCharge[] = [];

  unpaidTimeline: MonthlyCharge[] = [];

  // =====================================================
  // FILTERS
  // =====================================================

  searchValue = '';

  visible = false;

  // =====================================================
  // AUDIT
  // =====================================================

  lastPaymentDate = '';

  totalDebtAmount = 0;

  totalPayments = 0;

  totalTimelineMonths = 0;

  totalPaidMonths = 0;

  totalUnpaidMonths = 0;

  // =====================================================
  // STATES
  // =====================================================

  isLoading = false;

  timelineLoading = false;

  isSavingPayment = false;

  isPaymentDrawerVisible = false;

  // =====================================================
  // DRAWER
  // =====================================================

  paymentDrawerTitle = 'Novo Pagamento';

  drawerWidth: string | number = 720;

  drawerPlacement: 'right' | 'bottom' = 'right';

  // =====================================================
  // CONSTANTS
  // =====================================================

  private readonly MOBILE_BREAKPOINT = 768;

  private readonly DEFAULT_PAYMENT_METHOD = 'CASH';

  // =====================================================
  // CONSTRUCTOR
  // =====================================================

  constructor(
    private confirmations: OperationConfirmationService,
    private route: ActivatedRoute,
    private router: Router,
    private fb: FormBuilder,

    private customerService: CustomerService,
    private paymentService: PaymentService,
    private billingService: BillingService,

    private modal: NzModalService,
    private paymentInvoiceService: PaymentInvoiceService,
    private customerDetailPdfService: CustomerDetailPdfService,
    private message: NzMessageService
  ) {}

  // =====================================================
  // INIT
  // =====================================================

  ngOnInit(): void {

    this.createForm();

    this.route.params.subscribe(params => {

      this.customerId = params['id'];

      this.loadCustomerData();
    });

    this.updateDrawer();
  }

  get initials(): string {
    const value = this.customer?.name || 'C';
    return value
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map(part => part.charAt(0).toUpperCase())
      .join('') || 'C';
  }

  get fullAddress(): string {
    return this.customer?.address || 'Sem endereco registado';
  }

  get debtStatusLabel(): string {
    return this.customer?.monthsInDebt > 0 ? 'Em dívida' : 'Sem dívida vencida';
  }

  isOverdue(month: string): boolean { return isOverdueMonth(month); }

  get debtStatusColor(): string {
    return this.customer?.monthsInDebt > 0 ? 'volcano' : 'green';
  }

  // =====================================================
  // RESIZE
  // =====================================================

  @HostListener('window:resize')
  onResize(): void {

    this.updateDrawer();
  }

  // =====================================================
  // CREATE FORM
  // =====================================================

  createForm(): void {

    this.paymentForm = this.fb.group({

      amount: [
        '',
        Validators.required
      ],

      unitPrice: [200],

      taxRate: [300],

      numMonths: [
        1,
        [
          Validators.required,
          Validators.min(1)
        ]
      ],

      paymentMethod: [
        this.DEFAULT_PAYMENT_METHOD,
        Validators.required
      ]
    });
  }

  // =====================================================
  // LOAD ALL DATA
  // =====================================================


  // =====================================================
  // GET CUSTOMER
  // =====================================================

  private getCustomer(): void {

    this.customerService
      .getCustomerById(this.customerId)
      .subscribe({

        next: (customer: Customer) => {

          this.customer = customer;
          this.getCustomerTimeline();
          this.calculateDebtMonths();

          this.calculateDebtAmount();

          this.onNumMonthsChange();
        },

        error: () => this.message.error('Erro ao carregar cliente.')
      });
  }

  // =====================================================
  // GET TIMELINE
  // =====================================================

  getCustomerTimeline(): void {

    this.timelineLoading = true;

    this.billingService
      .getCustomerTimeline(this.customerId)
      .pipe(finalize(() => this.timelineLoading = false))
      .subscribe({

        next: (response: MonthlyCharge[]) => {
          if (response?.length) {

            this.monthlyTimeline = response;
          }
          else {

            this.monthlyTimeline =
              [];
          }

          this.unpaidTimeline =
            this.monthlyTimeline.filter(
              m => !m.paid
            );

          this.totalTimelineMonths =
            this.monthlyTimeline.length;

          this.totalPaidMonths =
            this.monthlyTimeline.filter(
              m => m.paid
            ).length;

          this.totalUnpaidMonths =
            this.monthlyTimeline.filter(
              m => !m.paid
            ).length;

        },

        error: () => {

          this.monthlyTimeline =
            [];

          this.unpaidTimeline =
            this.monthlyTimeline.filter(
              m => !m.paid
            );

          this.totalTimelineMonths =
            this.monthlyTimeline.length;

          this.totalPaidMonths =
            this.monthlyTimeline.filter(
              m => m.paid
            ).length;

          this.totalUnpaidMonths =
            this.monthlyTimeline.filter(
              m => !m.paid
            ).length;

        }
      });
  }

  getCustomerPayments(): void {

    this.isLoading = true;

    this.paymentService
      .getCustomerPayments(this.customerId)
      .pipe(finalize(() => this.isLoading = false))
      .subscribe({

        next: (payments: Payment[]) => {

          this.paymentDataSource = payments;

          this.listOfDisplayData = [
            ...payments
          ];

          this.totalPayments =
            payments.length;

          if (payments.length > 0) {

            this.lastPaymentDate =
              payments[0].paymentDate;
          }

        },

        error: () => this.message.error('Erro ao carregar pagamentos.')
      });
  }

  // =====================================================
  // PAYMENT MONTHS CHANGE
  // =====================================================

  onNumMonthsChange(): void {

    let numMonths = Number(
      this.paymentForm.get('numMonths')?.value || 1
    );

    if (!this.customer?.unpaidMonths?.length) {

      this.selectedMonths = [];

      return;
    }

    const maxMonths =
      this.customer.unpaidMonths.length;

    // ================================================
    // MIN VALIDATION
    // ================================================

    if (numMonths < 1) {

      numMonths = 1;
    }

    // ================================================
    // MAX VALIDATION
    // ================================================

    if (numMonths > maxMonths) {

      this.message.warning(
        `Foram informados ${numMonths} m?s(es), mas o cliente possui apenas ${maxMonths} por pagar.`
      );

      numMonths = maxMonths;
    }

    // ================================================
    // UPDATE FORM
    // ================================================

    this.paymentForm
      .get('numMonths')
      ?.setValue(
        numMonths,
        {
          emitEvent: false
        }
      );

    // ================================================
    // SELECT MONTHS
    // ================================================

    this.selectedMonths =
      this.customer.unpaidMonths
        .slice(0, numMonths);

    // ================================================
    // AUTO CALCULATE AMOUNT
    // ================================================

    this.paymentForm.patchValue(
      {
        amount:
          numMonths *
          (this.customer.monthlyFee || 0)
      },
      {
        emitEvent: false
      }
    );
  }

  // =====================================================
  // SAVE PAYMENT
  // =====================================================

  savePayment(): void {
    if (this.isSavingPayment || this.paymentForm.invalid || !this.selectedMonths.length) {
      if (!this.isSavingPayment) this.message.warning('Confira os períodos e os campos obrigatórios.');
      return;
    }
    const payload = {...this.paymentForm.value, customerId: this.customerId};
    this.confirmations.payment({customerId: this.customerId, customer: this.customer.name,
      amount: Number(payload.amount), months: [...this.selectedMonths], method: payload.paymentMethod || ''}, () => {
      this.isSavingPayment = true;
      return this.paymentService.addPayment(payload).pipe(finalize(() => this.isSavingPayment = false), tap({
        next: () => { this.loadCustomerData(); this.closePaymentDrawer(); this.message.success('Pagamento registado com sucesso.'); },
        error: () => this.message.error('Erro ao registar o pagamento. Confira o registo antes de tentar novamente.')
      }));
    });
  }


  loadCustomerData(): void {

    this.getCustomerPayments();

    this.getCustomer();
  }
  // =====================================================
  // OPEN DRAWER
  // =====================================================

  openPaymentDrawer(): void {

    if (
      !this.customer?.unpaidMonths?.length
    ) {

      this.message.warning(
        'Este cliente não possui mensalidades por pagar.'
      );

      return;
    }

    this.paymentForm.patchValue({

      numMonths: 1,

      amount: this.customer.monthlyFee
    });

    this.onNumMonthsChange();

    this.isPaymentDrawerVisible = true;
  }

  // =====================================================
  // CLOSE DRAWER
  // =====================================================

  closePaymentDrawer(): void {

    this.isPaymentDrawerVisible = false;

    this.paymentForm.reset({

      numMonths: 1,

      paymentMethod: this.DEFAULT_PAYMENT_METHOD
    });

    this.selectedMonths = [];
  }

  // =====================================================
  // DELETE PAYMENT
  // =====================================================

  deletePayment(data: Payment): void {
    this.confirmations.deletion('payment', data.id, [data.referenceCode, data.customerName, this.formatMoney(data.amount)].filter(Boolean).join(' · '), 'deletePaymentNote',
      () => this.paymentService.deletePayment(data.id).pipe(tap({
        next: () => { this.loadCustomerData(); this.message.success('Pagamento eliminado com sucesso.'); },
        error: () => this.message.error('Erro ao eliminar o pagamento.')
      })));
  }

  // =====================================================
  // DOWNLOAD PAYMENT
  // =====================================================

  download(payment: Payment): void {

    this.paymentInvoiceService
      .downloadPaymentInvoice(payment);
  }

  // =====================================================
  // DOWNLOAD CUSTOMER PDF
  // =====================================================

  downloadCustomerInfo(): void {
    const download = (history: boolean) => {
      this.customerDetailPdfService.downloadCustomerReport(this.customer,this.paymentDataSource,history);
      dialog.destroy();
    };
    const dialog: NzModalRef = this.modal.create({
      nzTitle: 'Preparar ficha A4 do cliente',
      nzContent: 'Escolha o conteúdo do documento. A ficha será gerada em A4 vertical, pronta para impressão.',
      nzMaskClosable: false,
      nzFooter: [
        {label:'Cancelar',onClick:()=>dialog.destroy()},
        {label:'Apenas dados do cliente',onClick:()=>download(false)},
        {label:'Incluir histórico',type:'primary',onClick:()=>download(true)}
      ]
    });
  }

  // =====================================================
  // DRAWER RESPONSIVE
  // =====================================================

  updateDrawer(): void {

    const isMobile =
      window.innerWidth <= this.MOBILE_BREAKPOINT;

    this.drawerWidth =
      isMobile ? '100%' : 720;

    this.drawerPlacement =
      'right';
  }

  // =====================================================
  // SEARCH
  // =====================================================

  search(): void {

    this.visible = false;

    this.listOfDisplayData =
      this.paymentDataSource.filter(
        (item: Payment) =>

          item.customerName
            .toLowerCase()
            .includes(
              this.searchValue.toLowerCase()
            )
      );
  }

  // =====================================================
  // RESET SEARCH
  // =====================================================

  reset(): void {

    this.searchValue = '';

    this.search();
  }

  // =====================================================
  // NAVIGATION
  // =====================================================

  onBack(): void {

    window.history.back();
  }

  goBack(): void {

    window.history.back();
  }

  goToCustomers(): void {
    this.router.navigate(['/app/customer']);
  }

  formatMoney(value: number | null | undefined): string {
    return money(value);
  }

  phoneHref(phone: string | null | undefined): string {
    const digits = (phone || '').toString().replace(/[^\d+]/g, '');
    return digits ? `tel:${digits}` : 'tel:';
  }

  // =====================================================
  // CALCULATE DEBT MONTHS
  // =====================================================

  private calculateDebtMonths(): void {

    if (!this.customer?.unpaidMonths?.length) {

      this.debtMonths = [];

      return;
    }

    this.debtMonths =
      this.customer.unpaidMonths.map(
        month => this.formatMonth(month)
      );
  }

  // =====================================================
  // CALCULATE DEBT AMOUNT
  // =====================================================

  private calculateDebtAmount(): void {

    this.totalDebtAmount =
      this.customer.monthsInDebt *
      this.customer.monthlyFee;
  }

  // =====================================================
  // FORMAT REFERENCE
  // =====================================================

  formatReferenceMonths(
    reference: string
  ): string {

    if (!reference) {
      return '';
    }

    return reference
      .split('|')
      .map(month =>
        this.formatMonth(month.trim())
      )
      .join(' | ');
  }

  // =====================================================
  // FORMAT MONTH ARRAY
  // =====================================================

  getFormattedReferenceMonths(
    reference: string
  ): string[] {

    if (!reference) {
      return [];
    }

    return reference
      .split('|')
      .map(month =>
        this.formatMonth(month.trim())
      );
  }

  // =====================================================
  // FORMAT MONTH
  // =====================================================

  formatMonth(month: string | { referenceYear?: string | number; referenceMonth?: string | number } | null | undefined): string {
    if (!month) {
      return '';
    }

    if (typeof month === 'object') {

      if (
        month.referenceYear &&
        month.referenceMonth
      ) {

        const monthValue =
          String(month.referenceMonth)
            .padStart(2, '0');

        month =
          `${month.referenceYear}-${monthValue}`;
      }
      else {

        return '';
      }
    }

    if (typeof month !== 'string') {
      return '';
    }

    const parts = month.split('-');

    if (parts.length < 2) {
      return month;
    }

    const [year, monthNumber] = parts;

    return `${MONTH_NAMES_PT[Number(monthNumber) - 1] || monthNumber} ${year}`;
  }

  // =====================================================
  // TIMELINE HELPERS
  // =====================================================

  getTimelineStatusColor(
    item: MonthlyCharge
  ): string {

    return item.paid
      ? 'green'
      : 'volcano';
  }

  getTimelineStatusLabel(
    item: MonthlyCharge
  ): string {

    return item.paid
      ? 'Pago'
      : 'Em D?vida';
  }

  formatTimelineMonth(
    item: MonthlyCharge
  ): string {
    const generatedMonth = item as MonthlyCharge & {
      referenceYear?: string | number;
      referenceMonth?: string | number;
    };

    if (generatedMonth.referenceYear && generatedMonth.referenceMonth) {
      return this.formatMonth({
        referenceYear: generatedMonth.referenceYear,
        referenceMonth: generatedMonth.referenceMonth
      });
    }

    return this.formatMonth(
      item.referenceMonth
    );
  }

  openPaymentByTimeline(
    item: MonthlyCharge
  ): void {

    if (!item.id) {
      return;
    }

    window.open(
      `/app/payment-detail/${item.id}`,
      '_blank'
    );
  }
}
