import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

import { CustomerService } from '../../services/customer.service';
import { PaymentService } from '../../services/payment.service';

import { Customer } from '../../models/WSM/customer';
import { Payment } from '../../models/WSM/payment';

import { NzMessageService } from 'ng-zorro-antd/message';
import { NzModalService } from 'ng-zorro-antd/modal';

import { PaymentInvoiceService } from '../../services/payment-invoice.service';

import { MonthlyChargeService } from '../../services/monthly-charge.service';
import { MonthlyCharge } from '../../models/monthly-charge';

@Component({
  selector: 'app-payment',
  standalone: false,
  templateUrl: './payment.component.html',
  styleUrls: ['./payment.component.scss'],
})
export class PaymentComponent implements OnInit {

  dataSource: Payment[] = [];
  listOfDisplayData: Payment[] = [];

  totalPayments = 0;
  confirmedPayments = 0;
  unconfirmedPayments = 0;

  isPaymentDrawerVisible = false;

  paymentForm!: FormGroup;

  drawerWidth: string | number = 720;
  drawerPlacement: 'right' | 'bottom' = 'right';

  searchValue = '';

  selectedCustomer: Customer | null = null;

  paymentDrawerTitle = "Novo Pagamento";

  isLoading = false;

  allCustomers: Customer[] = [];

  // 🔥 NOVO
  customerUnpaidMonths: MonthlyCharge[] = [];

  // 🔥 NOVO
  selectedMonths: string[] = [];

  constructor(
    private paymentService: PaymentService,
    private customerService: CustomerService,
    private monthlyChargeService: MonthlyChargeService,
    private message: NzMessageService,
    private fb: FormBuilder,
    private modal: NzModalService,
    private paymentInvoiceService: PaymentInvoiceService
  ) {}

  ngOnInit(): void {

    this.customerService.getCustomers().subscribe(customers => {
      this.allCustomers = customers;
    });

    this.paymentForm = this.fb.group({
      customerId: ['', Validators.required],
      amount: ['', Validators.required],
      numMonths: [1, [Validators.required, Validators.min(1)]],
      paymentMethod: ['', Validators.required]
    });

    this.getPayments();

    this.updateDrawer();

    window.addEventListener('resize', () => this.updateDrawer());
  }

  download(payment: Payment) {
    this.paymentInvoiceService.downloadPaymentInvoice(payment);
  }

  onCustomerSelect(customerId: string) {

    if (!customerId || customerId === 'null') {
      return;
    }

    this.customerService.getCustomerById(customerId).subscribe(c => {

      this.selectedCustomer = c;

      this.monthlyChargeService
        .getCustomerUnpaidMonths(customerId)
        .subscribe(months => {

          this.customerUnpaidMonths = months;

          this.onNumMonthsChange();
        });
    });
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

  openPaymentDrawer() {
    this.isPaymentDrawerVisible = true;
  }

  closePaymentDrawer() {

    this.isPaymentDrawerVisible = false;

    this.selectedCustomer = null;

    this.selectedMonths = [];

    this.customerUnpaidMonths = [];

    this.paymentForm.reset({
      customerId: null,
      amount: null,
      numMonths: 1,
      paymentMethod: null
    });
  }

  savePayment() {

    if (this.paymentForm.invalid) {
      this.message.warning('Preencha todos os campos corretamente ⚠️');
      return;
    }

    const payload = {
      ...this.paymentForm.value
    };

    this.isLoading = true;

    this.paymentService.addPayment(payload).subscribe({

      next: () => {

        this.message.success('Pagamento registado com sucesso 💧💰');

        this.getPayments();

        this.closePaymentDrawer();

        this.isLoading = false;
      },

      error: (err) => {

        console.error(err);

        this.message.error('Erro ao processar o pagamento ❌');

        this.isLoading = false;
      }
    });
  }

  calculatePaymentStats() {

    this.totalPayments = this.dataSource.length;

    this.confirmedPayments = this.dataSource.filter(
      (payment) => payment.confirmed
    ).length;

    this.unconfirmedPayments = this.dataSource.filter(
      (payment) => !payment.confirmed
    ).length;
  }

  reset(): void {
    this.searchValue = '';
    this.filterData();
  }

  onBack() {
    window.history.back();
  }

  filterData(): void {

    const search = this.searchValue.toLowerCase();

    this.listOfDisplayData = this.dataSource.filter((item: Payment) =>
      (item.customerName || '').toLowerCase().includes(search)
    );
  }

  getPayments() {

    this.isLoading = true;

    this.paymentService.getPayments().subscribe((payments: any[]) => {

      this.dataSource = payments.map(p => ({
        ...p,
        confirmed: p.confirmed ?? p.status,
        numMonths: Number(p.numMonths)
      }));

      this.listOfDisplayData = [...this.dataSource];

      this.calculatePaymentStats();

      this.isLoading = false;
    });
  }

  viewPayment(data: Payment) {}

  onNumMonthsChange() {

    const num = this.paymentForm.get('numMonths')?.value || 1;

    const max = this.customerUnpaidMonths.length || 1;

    if (num < 1) {

      this.paymentForm.get('numMonths')?.setValue(1);

      this.selectedMonths = this.customerUnpaidMonths
        .slice(0, 1)
        .map(m => m.referenceMonth);

    } else if (num > max) {

      this.paymentForm.get('numMonths')?.setValue(max);

      this.selectedMonths = this.customerUnpaidMonths
        .slice(0, max)
        .map(m => m.referenceMonth);

    } else {

      this.selectedMonths = this.customerUnpaidMonths
        .slice(0, num)
        .map(m => m.referenceMonth);
    }
  }

  deletePayment(data: Payment) {}
}
