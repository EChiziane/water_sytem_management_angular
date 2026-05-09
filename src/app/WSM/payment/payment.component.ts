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

import { NzMessageService } from 'ng-zorro-antd/message';
import { NzModalService } from 'ng-zorro-antd/modal';

import { Customer } from '../../models/WSM/customer';
import { Payment } from '../../models/WSM/payment';

import { CustomerService } from '../../services/customer.service';
import { PaymentInvoiceService } from '../../services/payment-invoice.service';
import { PaymentService } from '../../services/payment.service';

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

  totalPayments = 0;

  confirmedPayments = 0;

  unconfirmedPayments = 0;

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
    private message: NzMessageService,
    private modal: NzModalService,
    private fb: FormBuilder
  ) {}

  ngOnInit(): void {

    this.createForm();

    this.loadCustomers();

    this.getPayments();

    this.updateDrawer();
  }

  @HostListener('window:resize')
  onResize(): void {

    this.updateDrawer();
  }

  createForm(): void {

    this.paymentForm = this.fb.group({

      customerId: [
        null,
        Validators.required
      ],

      amount: [
        0,
        Validators.required
      ],

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

  loadCustomers(): void {

    this.customerService
      .getCustomers()
      .subscribe(customers => {

        this.allCustomers =
          customers.filter(customer =>

            (customer.monthsInDebt || 0) > 0
          );
      });
  }

  onCustomerSelect(customerId: string): void {

    if (!customerId || customerId === 'null') {
      return;
    }

    this.customerService
      .getCustomerById(customerId)
      .subscribe(customer => {

        this.selectedCustomer = customer;

        if (!customer.unpaidMonths?.length) {

          this.message.warning(
            'Cliente sem dívida'
          );

          return;
        }

        this.paymentForm.patchValue({

          numMonths: 1,

          amount: customer.monthlyFee || 0
        });

        this.onNumMonthsChange();
      });
  }

  onNumMonthsChange(): void {

    if (!this.selectedCustomer?.unpaidMonths?.length) {

      this.selectedMonths = [];

      return;
    }

    let numMonths = Number(
      this.paymentForm.get('numMonths')?.value || 1
    );

    const maxMonths =
      this.selectedCustomer.unpaidMonths.length;

// ===== MIN =====

    if (numMonths < 1) {
      this.paymentForm.get('numMonths')?.setValue(1);

      this.selectedMonths = this.selectedCustomer.unpaidMonths.slice(0, 1);
      numMonths = 1;
    } else if (numMonths > maxMonths)
    {
      this.paymentForm.get('numMonths')?.setValue(maxMonths);

      this.selectedMonths = this.selectedCustomer.unpaidMonths.slice(0, maxMonths);
    }else {

      this.selectedMonths = this.selectedCustomer.unpaidMonths.slice(0, numMonths);
    }

// ===== MAX =====

    if (numMonths > maxMonths) {

      numMonths = maxMonths;

      this.message.warning(
        `O cliente possui apenas ${maxMonths} mês(es) em dívida, mas foram informados ${numMonths}.`
      );
    }

  }

  updateDrawer(): void {

    const isMobile =
      window.innerWidth <= this.MOBILE_BREAKPOINT;

    this.drawerWidth =
      isMobile ? '100%' : 720;

    this.drawerPlacement =
      isMobile ? 'bottom' : 'right';
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

      this.message.warning(
        'Preencha todos os campos corretamente ⚠️'
      );

      return;
    }

    if (!this.selectedCustomer?.id) {

      this.message.warning(
        'Selecione um cliente'
      );

      return;
    }

    const payload = {

      ...this.paymentForm.value,

      customerId: this.selectedCustomer.id
    };

    this.isLoading = true;

    this.isSaving = true;

    this.paymentService
      .addPayment(payload)
      .subscribe({

        next: () => {

          this.message.success(
            'Pagamento registado com sucesso 💧💰'
          );

          this.getPayments();

          this.closePaymentDrawer();

          this.stopLoading();
        },

        error: (err) => {

          console.error(err);

          this.message.error(
            'Erro ao processar o pagamento ❌'
          );

          this.stopLoading();
        }
      });
  }

  stopLoading(): void {

    this.isLoading = false;

    this.isSaving = false;
  }

  calculatePaymentStats(): void {

    this.totalPayments =
      this.dataSource.length;

    this.confirmedPayments =
      this.dataSource.filter(
        payment => payment.confirmed
      ).length;

    this.unconfirmedPayments =
      this.dataSource.filter(
        payment => !payment.confirmed
      ).length;
  }

  reset(): void {

    this.searchValue = '';

    this.filterData();
  }

  onBack(): void {

    window.history.back();
  }

  filterData(): void {

    const search =
      this.searchValue.toLowerCase();

    this.listOfDisplayData =
      this.dataSource.filter((item: Payment) =>

        (item.customerName || '')
          .toLowerCase()
          .includes(search)

        ||

        (item.referenceCode || '')
          .toLowerCase()
          .includes(search)
      );
  }

  getPayments(): void {

    this.isLoading = true;

    this.paymentService
      .getPayments()
      .subscribe((payments: any[]) => {

        this.dataSource = payments.map(payment => ({

          ...payment,

          confirmed:
            payment.confirmed ?? payment.status,

          numMonths:
            Number(payment.numMonths)
        }));

        this.listOfDisplayData = [
          ...this.dataSource
        ];

        this.calculatePaymentStats();

        this.isLoading = false;
      });
  }

  viewPayment(data: Payment): void {}

  deletePayment(data: Payment): void {}

  download(payment: Payment): void {

    this.paymentInvoiceService
      .downloadPaymentInvoice(payment);
  }

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

  formatMonth(month: string): string {

    if (!month) {
      return '';
    }

    const [year, monthNumber] =
      month.split('-');

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

    return `${
      monthNames[
      Number(monthNumber) - 1
        ]
    } ${year}`;
  }
}
