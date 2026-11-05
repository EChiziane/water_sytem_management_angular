import { ActivatedRoute, Router } from '@angular/router';
import { DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ListViewStateService } from '@core/services/dialogs/list-view-state.service';
import { UnsavedChangesService } from '@core/services/dialogs/unsaved-changes.service';
import { OperationFeedbackService } from '@core/services/dialogs/operation-feedback.service';
import { money } from '@shared/utils/payment-presentation';
import { paymentPeriods } from '@shared/utils/billing-period';
import { businessTimestamp, maputoMonthKey } from '@shared/utils/business-date';
import { TranslationService } from '@core/services/i18n/translation.service';
import { PermissionService } from '@core/auth/permission.service';
import { OperationConfirmationService } from '@core/services/dialogs/operation-confirmation.service';
import { tap } from 'rxjs';
import { Component, HostListener, Input, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { finalize } from 'rxjs';
import { NzMessageService } from 'ng-zorro-antd/message';
import { Customer } from '@shared/models/customer';
import { Payment } from '@shared/models/payment';
import { CustomerService } from '@core/services/customers/customer.service';
import { PaymentInvoiceService } from '@core/services/documents/payment-invoice.service';
import { PaymentPayload, PaymentService } from '@core/services/payments/payment.service';
import { MONTH_NAMES_PT } from '@shared/constants/app-labels';
import { WaterReportPdfService } from '@core/services/documents/water-report-pdf.service';

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
  lastPayment: Payment | null = null;
  selectedMonths: string[] = [];

  selectedYear = '';
  selectedPeriod = '';
  periodMode: 'received' | 'settled' = 'received';
  searchValue = '';

  isLoading = false;
  loadFailed = false;
  isSaving = false;
  isPaymentDrawerVisible = false;
  paymentDrawerTitle = 'Novo Pagamento';

  drawerWidth: string | number = 720;
  drawerPlacement: 'right' | 'bottom' = 'right';

  private readonly MOBILE_BREAKPOINT = 768;
  private readonly DEFAULT_PAYMENT_METHOD = 'CASH';

  pageIndex = 1;
  ngOnDestroy() {
    this.views.save('payments', {
      searchValue: this.searchValue,
      selectedYear: this.selectedYear,
      selectedPeriod: this.selectedPeriod,
      periodMode: this.periodMode,
      pageIndex: this.pageIndex,
    });
  }
  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private destroyRef: DestroyRef,
    private views: ListViewStateService,
    private unsaved: UnsavedChangesService,
    private feedback: OperationFeedbackService,
    public translations: TranslationService,
    public permissions: PermissionService,
    private confirmations: OperationConfirmationService,
    private paymentService: PaymentService,
    private customerService: CustomerService,
    private paymentInvoiceService: PaymentInvoiceService,
    private reports: WaterReportPdfService,
    private message: NzMessageService,
    private fb: FormBuilder,
  ) {}

  ngOnInit(): void {
    Object.assign(this, this.views.read('payments'));
    this.createForm();
    this.loadCustomers();
    this.getPayments();
    this.updateDrawer();
    this.route.queryParamMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((params) => {
      const customerId = params.get('customerId');
      if (customerId) {
        this.openPaymentDrawer();
        this.onCustomerSelect(customerId);
      }
    });
  }

  get totalPayments(): number {
    return this.dataSource.length;
  }

  get confirmedPayments(): number {
    return this.dataSource.filter((payment) => payment.confirmed === true).length;
  }

  get pendingPayments(): number {
    return this.dataSource.filter((payment) => payment.confirmed === false).length;
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

    return (
      Number(this.selectedCustomer.monthlyFee || 0) *
      Number(this.selectedCustomer.monthsInDebt || 0)
    );
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
      numMonths: [1, [Validators.required, Validators.min(1), Validators.pattern(/^[1-9]\d*$/)]],
      paymentMethod: [this.DEFAULT_PAYMENT_METHOD, Validators.required],
    });
  }

  loadCustomers(): void {
    this.customerService.getCustomers().subscribe({
      next: (customers) => {
        this.allCustomers = customers.filter(
          (customer) => (customer.unpaidMonths?.length || 0) > 0,
        );
      },
      error: () => this.message.error('Erro ao carregar clientes.'),
    });
  }

  onCustomerSelect(customerId: string): void {
    if (!customerId || customerId === 'null') {
      return;
    }

    this.customerService.getCustomerById(customerId).subscribe({
      next: (customer) => {
        this.selectedCustomer = {
          ...customer,
          unpaidMonths: [...(customer.unpaidMonths || [])].sort(),
        };
        this.selectedMonths = [];
        this.paymentForm.patchValue({ customerId: customer.id });

        if (!customer.unpaidMonths?.length) {
          this.paymentForm.patchValue({ numMonths: 1, amount: 0 });
          this.message.warning('Cliente sem mensalidades por pagar');
          return;
        }

        this.paymentForm.patchValue({
          numMonths: 1,
          amount: customer.monthlyFee || 0,
        });

        this.onNumMonthsChange();
      },
      error: () => this.message.error('Erro ao carregar cliente.'),
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
      this.message.warning(`O cliente possui apenas ${maxMonths} mensalidade(s) por pagar.`);
    }

    this.selectedMonths = this.selectedCustomer.unpaidMonths.slice(0, numMonths);
    this.paymentForm
      .get('amount')
      ?.setValue(Number(this.selectedCustomer.monthlyFee || 0) * numMonths, { emitEvent: false });
  }

  updateDrawer(): void {
    const isMobile = window.innerWidth <= this.MOBILE_BREAKPOINT;

    this.drawerWidth = isMobile ? '100%' : 720;
    this.drawerPlacement = 'right';
  }

  openPaymentDrawer(): void {
    this.isPaymentDrawerVisible = true;
  }

  async closePaymentDrawer(saved = false) {
    if (this.isSaving && !saved) return;
    if (!saved && this.paymentForm.dirty && !(await this.unsaved.confirm())) return;
    this.isPaymentDrawerVisible = false;
    if (this.route.snapshot.queryParamMap.has('customerId'))
      this.router.navigate([], {
        relativeTo: this.route,
        queryParams: { customerId: null },
        queryParamsHandling: 'merge',
        replaceUrl: true,
      });
    this.selectedCustomer = null;
    this.selectedMonths = [];

    this.paymentForm.reset({
      customerId: null,
      amount: 0,
      numMonths: 1,
      paymentMethod: this.DEFAULT_PAYMENT_METHOD,
    });
  }

  savePayment(): void {
    if (
      this.isSaving ||
      this.paymentForm.invalid ||
      !this.selectedCustomer?.id ||
      !this.selectedMonths.length
    ) {
      if (!this.isSaving)
        this.message.warning('Confira o cliente, os períodos e os campos do pagamento.');
      return;
    }
    const payload: PaymentPayload = {
      ...this.paymentForm.value,
      customerId: this.selectedCustomer.id,
    };
    this.confirmations.payment(
      {
        customerId: this.selectedCustomer.id,
        customer: this.selectedCustomer.name,
        amount: Number(payload.amount),
        months: [...this.selectedMonths],
        periodAmounts: Object.fromEntries(
          this.selectedMonths.map((m) => [m, Number(this.selectedCustomer!.monthlyFee)]),
        ),
        method: payload.paymentMethod || '',
      },
      () => {
        this.isLoading = true;
        this.isSaving = true;
        return this.paymentService.addPayment(payload).pipe(
          finalize(() => this.stopLoading()),
          tap({
            next: (payment) => {
              this.lastPayment = payment;
              this.loadCustomers();
              this.message.success('Pagamento registado com sucesso.');
              this.getPayments();
              this.closePaymentDrawer(true);
            },
            error: (error) =>
              this.feedback.error(
                error,
                'Não foi possível registar o pagamento. Confira os registos antes de repetir; o formulário foi preservado.',
              ),
          }),
        );
      },
    );
  }

  stopLoading(): void {
    this.isLoading = false;
    this.isSaving = false;
  }

  reset(): void {
    this.selectedYear = '';
    this.selectedPeriod = '';
    this.periodMode = 'received';
    this.searchValue = '';
    this.filterData();
  }

  onBack(): void {
    window.history.back();
  }

  filterData(): void {
    const search = this.searchValue.toLowerCase();

    this.listOfDisplayData = this.dataSource
      .filter(
        (item) =>
          (!this.selectedYear && !this.selectedPeriod) ||
          this.periodsFor(item).some(
            (p) =>
              (!this.selectedYear || p.startsWith(this.selectedYear + '-')) &&
              (!this.selectedPeriod || p === this.selectedPeriod),
          ),
      )
      .filter(
        (item: Payment) =>
          (item.customerName || '').toLowerCase().includes(search) ||
          (item.referenceCode || '').toLowerCase().includes(search),
      );
  }

  periodsFor(payment: Payment): string[] {
    return this.periodMode === 'settled'
      ? paymentPeriods(payment.referenceMonth)
      : [maputoMonthKey(new Date(businessTimestamp(payment.paymentDate)))].filter(Boolean);
  }
  get availablePeriods(): string[] {
    return [...new Set(this.dataSource.flatMap((p) => this.periodsFor(p)))].sort().reverse();
  }
  changePeriodMode(): void {
    this.selectedYear = '';
    this.selectedPeriod = '';
    this.filterData();
  }
  getPayments(): void {
    this.loadFailed = false;
    this.isLoading = true;

    this.paymentService
      .getPayments()
      .pipe(finalize(() => (this.isLoading = false)))
      .subscribe({
        next: (payments) => {
          this.dataSource = payments.map((payment) => ({
            ...payment,
            numMonths: Number(payment.numMonths),
          }));
          this.filterData();
        },
        error: () => {
          this.loadFailed = true;
        },
      });
  }

  download(payment: Payment): void {
    this.paymentInvoiceService.downloadPaymentInvoice(payment);
  }

  downloadPaymentList(): void {
    if (!this.permissions.can('reports.financial')) return;
    this.reports.downloadPaymentList(this.listOfDisplayData);
  }

  formatMoney(value: number | null | undefined): string {
    return money(value);
  }

  getCustomerInitials(value: string | null | undefined): string {
    const name = value || 'Cliente';
    return (
      name
        .trim()
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part.charAt(0).toUpperCase())
        .join('') || 'C'
    );
  }

  phoneHref(phone: string | null | undefined): string {
    const digits = (phone || '').toString().replace(/[^\d+]/g, '');
    return digits ? `tel:${digits}` : 'tel:';
  }

  getFormattedReferenceMonths(reference: string): string[] {
    if (!reference) {
      return [];
    }

    return reference.split('|').map((month) => this.formatMonth(month.trim()));
  }

  formatMonth(month: string): string {
    if (!month) {
      return '';
    }

    const [year, monthNumber] = month.split('-');
    return `${MONTH_NAMES_PT[Number(monthNumber) - 1]} ${year}`;
  }
}
