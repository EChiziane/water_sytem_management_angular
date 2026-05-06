import {Component, Input, OnInit} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {ActivatedRoute} from '@angular/router';
import {Payment} from '../../../models/WSM/payment';
import {Customer} from '../../../models/WSM/customer';
import {CustomerService} from '../../../services/customer.service';
import {PaymentService} from '../../../services/payment.service';
import {FormBuilder, FormGroup, Validators} from '@angular/forms';
import {CustomerPaymentInvoiceService} from '../../../services/customer-payment-invoice.service';
import {NzMessageService} from "ng-zorro-antd/message";
import {NzModalService} from "ng-zorro-antd/modal";
import {PaymentInvoiceService} from '../../../services/payment-invoice.service';


@Component({
  selector: 'app-customer-details',
  standalone: false,
  templateUrl: './customer-details.component.html',
  styleUrl: './customer-details.component.scss'
})
export class CustomerDetailsComponent implements OnInit {

  @Input() customerId!: string;

  customer!: Customer;

  debtMonths: string[] = [];

  paymentDataSource: Payment[] = [];

  listOfDisplayData: Payment[] = [];

  isLoading = false;

  isPaymentDrawerVisible = false;

  paymentForm!: FormGroup;

  paymentDrawerTitle = "Novo Pagamento";

  selectedMonths: string[] = [];

  visible = false;

  searchValue = '';

  drawerWidth: string | number = 720;

  drawerPlacement: 'right' | 'bottom' = 'right';

  constructor(
    private http: HttpClient,
    private route: ActivatedRoute,
    private fb: FormBuilder,
    private customerService: CustomerService,
    private customerPaymentInvoiceService: CustomerPaymentInvoiceService,
    private paymentService: PaymentService,
    private modal: NzModalService,
    private paymentInvoiceService: PaymentInvoiceService,
    private message: NzMessageService
  ) {}

  ngOnInit(): void {

    this.paymentForm = this.fb.group({
      amount: ['', Validators.required],
      unitPrice: [200],
      taxRate: [300],
      numMonths: [1, [Validators.required, Validators.min(1)]],
      paymentMethod: ['', Validators.required]
    });

    this.route.params.subscribe(params => {
      this.customerId = params['id'];
    });

    this.getCustomerPayments();

    this.getCustomer();

    this.updateDrawer();

    window.addEventListener('resize', () => this.updateDrawer());
  }

  download(payment: Payment) {
    this.paymentInvoiceService.downloadPaymentInvoice(payment);
  }

  updateDrawer() {

    if (window.innerWidth <= 768) {

      this.drawerWidth = '100%';

      this.drawerPlacement = 'bottom';

    } else {

      this.drawerWidth = 720;

      this.drawerPlacement = 'right';
    }
  }

  onNumMonthsChange() {

    const num = this.paymentForm.get('numMonths')?.value || 1;

    if (!this.customer?.unpaidMonths?.length) {
      this.selectedMonths = [];
      return;
    }

    const maxMonths = this.customer.unpaidMonths.length;

    if (num < 1) {

      this.paymentForm.get('numMonths')?.setValue(1);

      this.selectedMonths = this.customer.unpaidMonths.slice(0, 1);

    } else if (num > maxMonths) {

      this.paymentForm.get('numMonths')?.setValue(maxMonths);

      this.selectedMonths = this.customer.unpaidMonths.slice(0, maxMonths);

    } else {

      this.selectedMonths = this.customer.unpaidMonths.slice(0, num);
    }
  }

  goBack() {
    window.history.back();
  }

  editCustomer() {}

  getCustomerPayments() {

    this.isLoading = true;

    this.paymentService
      .getCustomerPayments(this.customerId)
      .subscribe((payments: Payment[]) => {

        this.paymentDataSource = payments;

        this.isLoading = false;

        this.listOfDisplayData = [...this.paymentDataSource];
      });
  }

  savePayment() {

    if (this.paymentForm.invalid) return;

    const payload = {
      ...this.paymentForm.value,
      customerId: this.customerId
    };

    this.paymentService.addPayment(payload).subscribe({

      next: () => {

        this.getCustomer();

        this.getCustomerPayments();

        this.closePaymentDrawer();

        this.message.success('Pagamento realizado com sucesso 💧');
      }
    });
  }

  openPaymentDrawer() {
    this.isPaymentDrawerVisible = true;
  }

  closePaymentDrawer() {

    this.isPaymentDrawerVisible = false;

    this.paymentForm.reset({
      numMonths: 1
    });

    this.selectedMonths = [];
  }

  deletePayment(data: Payment) {

    this.modal.confirm({

      nzTitle: 'Confirmar eliminação',

      nzContent: `Tem a certeza que deseja eliminar este pagamento de <strong>${data.customerName}</strong>?`,

      nzOkText: 'Sim, eliminar',

      nzOkDanger: true,

      nzCancelText: 'Cancelar',

      nzOnOk: () => {

        this.paymentService.deletePayment(data.id).subscribe({

          next: () => {

            this.message.success('Pagamento eliminado com sucesso ✅');

            this.getCustomerPayments();

            this.getCustomer();
          },

          error: () => {

            this.message.error('Erro ao eliminar o pagamento 🚫');
          }
        });
      }
    });
  }

  viewPayment(data: Payment) {}

  private getCustomer() {

    this.customerService
      .getCustomerById(this.customerId)
      .subscribe({

        next: (customer: Customer) => {

          this.customer = customer;

          this.calculateDebtMonths();

          this.onNumMonthsChange();
        }
      });
  }

  search(): void {

    this.visible = false;

    this.listOfDisplayData = this.paymentDataSource.filter(
      (item: Payment) =>
        item.customerName
          .toLowerCase()
          .includes(this.searchValue.toLowerCase())
    );
  }

  reset(): void {

    this.searchValue = '';

    this.search();
  }

  onBack() {
    window.history.back();
  }

  private calculateDebtMonths() {

    if (!this.customer?.unpaidMonths?.length) {

      this.debtMonths = [];

      return;
    }

    this.debtMonths = this.customer.unpaidMonths.map(
      month => this.formatMonth(month)
    );
  }

  formatMonth(month: string): string {

    if (!month) return '';

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
