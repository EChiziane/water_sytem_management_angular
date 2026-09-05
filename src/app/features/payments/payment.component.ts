import {Component, HostListener, Input, OnInit} from '@angular/core';
import {FormBuilder, FormGroup, Validators} from '@angular/forms';
import {finalize} from 'rxjs';
import {NzMessageService} from 'ng-zorro-antd/message';
import {Customer} from '@shared/models/WSM/customer';
import {Payment} from '@shared/models/WSM/payment';
import {CustomerService} from '@core/services/customer.service';
import {PaymentInvoiceService} from '@core/services/payment-invoice.service';
import {PaymentPayload, PaymentService} from '@core/services/payment.service';
import {MONTH_NAMES_PT} from '@shared/constants/app-labels';
import {WaterReportPdfService} from '@core/services/water-report-pdf.service';

@Component({
  selector: 'app-payment',
  standalone: false,
  templateUrl: './payment.component.html',
  styleUrls: ['./payment.component.scss'],
})
export class PaymentComponent implements OnInit {
  @Input() customerId!: string;

  paymentForm!: FormGroup;
  dataSource: Payment[] = [];
  listOfDisplayData: Payment[] = [];
  allCustomers: Customer[] = [];
  selectedCustomer: Customer | null = null;
  selectedMonths: string[] = [];

  searchValue = '';

  isLoading = false;
  isSaving = false;
  isPaymentDrawerVisible = false;
  paymentDrawerTitle = 'Novo Pagamento';

  drawerWidth: string | number = 720;
  drawerPlacement: 'right' | 'bottom' = 'right';

  private readonly MOBILE_BREAKPOINT = 768;
  private readonly DEFAULT_PAYMENT_METHOD = 'CASH';

  constructor(
    private paymentService: PaymentService,
    private customerService: CustomerService,
    private paymentInvoiceService: PaymentInvoiceService,
    private reports: WaterReportPdfService,
    private message: NzMessageService,
    private fb: FormBuilder
  ) {
  }

  ngOnInit(): void {
    this.createForm();
    this.loadCustomers();
    this.getPayments();
    this.updateDrawer();
  }

  get totalPayments(): number {
    return this.dataSource.length;
  }

  get confirmedPayments(): number {
    return this.dataSource.filter(payment => payment.confirmed).length;
  }

  get pendingPayments(): number {
    return this.dataSource.filter(payment => !payment.confirmed).length;
  }

  get totalReceivedAmount(): number {
    return this.dataSource.reduce((sum, payment) => sum + Number(payment.amount || 0), 0);
  }

  get selectedPaymentTotal(): number {
    return Number(this.paymentForm?.get('amount')?.value || 0);
  }

  get selectedDebtTotal(): number {
    if (!this.selectedCustomer) {
      return 0;
    }

    return Number(this.selectedCustomer.monthlyFee || 0) * Number(this.selectedCustomer.monthsInDebt || 0);
  }

  get filteredReceivedAmount(): number {
    return this.listOfDisplayData.reduce((sum, payment) => sum + Number(payment.amount || 0), 0);
  }

  @HostListener('window:resize')
  onResize(): void {
    this.updateDrawer();
  }

  createForm(): void {
    this.paymentForm = this.fb.group({
      customerId: [null, Validators.required],
      amount: [0, Validators.required],
      numMonths: [1, [Validators.required, Validators.min(1)]],
      paymentMethod: [this.DEFAULT_PAYMENT_METHOD, Validators.required]
    });
  }

  loadCustomers(): void {
    this.customerService.getCustomers().subscribe({
      next: customers => {
        this.allCustomers = customers.filter(customer => (customer.monthsInDebt || 0) > 0);
      },
      error: () => this.message.error('Erro ao carregar clientes.')
    });
  }

  onCustomerSelect(customerId: string): void {
    if (!customerId || customerId === 'null') {
      return;
    }

    this.customerService.getCustomerById(customerId).subscribe({
      next: customer => {
        this.selectedCustomer = customer;

        if (!customer.unpaidMonths?.length) {
          this.message.warning('Cliente sem d?vida');
          return;
        }

        this.paymentForm.patchValue({
          numMonths: 1,
          amount: customer.monthlyFee || 0
        });

        this.onNumMonthsChange();
      },
      error: () => this.message.error('Erro ao carregar cliente.')
    });
  }

  onNumMonthsChange(): void {
    if (!this.selectedCustomer?.unpaidMonths?.length) {
      this.selectedMonths = [];
      return;
    }

    let numMonths = Number(this.paymentForm.get('numMonths')?.value || 1);
    const maxMonths = this.selectedCustomer.unpaidMonths.length;

    if (numMonths < 1) {
      numMonths = 1;
      this.paymentForm.get('numMonths')?.setValue(numMonths);
    }

    if (numMonths > maxMonths) {
      numMonths = maxMonths;
      this.paymentForm.get('numMonths')?.setValue(numMonths);
      this.message.warning(`O cliente possui apenas ${maxMonths} m?s(es) em d?vida.`);
    }

    this.selectedMonths = this.selectedCustomer.unpaidMonths.slice(0, numMonths);
    this.paymentForm.get('amount')?.setValue(
      Number(this.selectedCustomer.monthlyFee || 0) * numMonths,
      {emitEvent: false}
    );
  }

  updateDrawer(): void {
    const isMobile = window.innerWidth <= this.MOBILE_BREAKPOINT;

    this.drawerWidth = isMobile ? '100%' : 720;
    this.drawerPlacement = 'right';
  }

  openPaymentDrawer(): void {
    this.isPaymentDrawerVisible = true;
  }

  closePaymentDrawer(): void {
    this.isPaymentDrawerVisible = false;
    this.selectedCustomer = null;
    this.selectedMonths = [];

    this.paymentForm.reset({
      customerId: null,
      amount: 0,
      numMonths: 1,
      paymentMethod: this.DEFAULT_PAYMENT_METHOD
    });
  }

  savePayment(): void {
    if (this.paymentForm.invalid) {
      this.message.warning('Preencha todos os campos corretamente.');
      return;
    }

    if (!this.selectedCustomer?.id) {
      this.message.warning('Selecione um cliente');
      return;
    }

    const payload: PaymentPayload = {
      ...this.paymentForm.value,
      customerId: this.selectedCustomer.id
    };

    this.isLoading = true;
    this.isSaving = true;

    this.paymentService.addPayment(payload)
      .pipe(finalize(() => this.stopLoading()))
      .subscribe({
        next: () => {
          this.message.success('Pagamento registado com sucesso.');
          this.getPayments();
          this.closePaymentDrawer();
        },
        error: () => this.message.error('Erro ao processar o pagamento.')
      });
  }

  stopLoading(): void {
    this.isLoading = false;
    this.isSaving = false;
  }

  reset(): void {
    this.searchValue = '';
    this.filterData();
  }

  onBack(): void {
    window.history.back();
  }

  filterData(): void {
    const search = this.searchValue.toLowerCase();

    this.listOfDisplayData = this.dataSource.filter((item: Payment) =>
      (item.customerName || '').toLowerCase().includes(search) ||
      (item.referenceCode || '').toLowerCase().includes(search)
    );
  }

  getPayments(): void {
    this.isLoading = true;

    this.paymentService.getPayments()
      .pipe(finalize(() => this.isLoading = false))
      .subscribe({
        next: payments => {
          this.dataSource = payments.map(payment => ({
            ...payment,
            numMonths: Number(payment.numMonths)
          }));
          this.listOfDisplayData = [...this.dataSource];
        },
        error: () => this.message.error('Erro ao carregar pagamentos.')
      });
  }

  download(payment: Payment): void {
    this.paymentInvoiceService.downloadPaymentInvoice(payment);
  }

  downloadPaymentList(): void {
    this.reports.downloadPaymentList(this.listOfDisplayData);
  }

  formatMoney(value: number | null | undefined): string {
    return `${Number(value || 0).toFixed(2)} MT`;
  }

  getPaymentStatusLabel(payment: Payment): string {
    return payment.confirmed ? 'Confirmado' : 'Nao confirmado';
  }

  getPaymentStatusColor(payment: Payment): string {
    return payment.confirmed ? 'green' : 'volcano';
  }

  getCustomerInitials(value: string | null | undefined): string {
    const name = value || 'Cliente';
    return name
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map(part => part.charAt(0).toUpperCase())
      .join('') || 'C';
  }

  phoneHref(phone: string | null | undefined): string {
    const digits = (phone || '').toString().replace(/[^\d+]/g, '');
    return digits ? `tel:${digits}` : 'tel:';
  }

  getFormattedReferenceMonths(reference: string): string[] {
    if (!reference) {
      return [];
    }

    return reference
      .split('|')
      .map(month => this.formatMonth(month.trim()));
  }

  formatMonth(month: string): string {
    if (!month) {
      return '';
    }

    const [year, monthNumber] = month.split('-');
    return `${MONTH_NAMES_PT[Number(monthNumber) - 1]} ${year}`;
  }
}
