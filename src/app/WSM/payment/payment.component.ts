import {Component, OnInit} from '@angular/core';
import {FormBuilder, FormGroup, Validators} from '@angular/forms';
import {CustomerService} from '../../services/customer.service';
import {PaymentService} from '../../services/payment.service';
import {Customer} from '../../models/WSM/customer';
import {ReciboService} from '../../services/recibo.service';
import {NzMessageService} from 'ng-zorro-antd/message';
import {NzModalService} from 'ng-zorro-antd/modal';
import {CustomerPaymentInvoiceService} from '../../services/customer-payment-invoice.service';
import {Payment} from '../../models/WSM/payment';
import {PaymentInvoiceService} from '../../services/payment-invoice.service';


@Component({
  selector: 'app-payment',
  standalone: false,
  templateUrl: './payment.component.html',
  styleUrls: ['./payment.component.scss'],
})
export class PaymentComponent implements OnInit {

  dataSource: Payment[] = []; // Inicializado como array vazio
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
  customer!: Customer;
  debtMonths: string[] = [];
  isLoading = false;
  selectedMonths: string[] = [];
  allCustomers: Customer[] = [];

  constructor(
    private paymentService: PaymentService,
    private customerService: CustomerService,
    private customerPaymentInvoiceService: CustomerPaymentInvoiceService,
    private reciboService: ReciboService,
    private message: NzMessageService,
    private fb: FormBuilder,
    private modal: NzModalService,
    private  paymentInvoiceService:PaymentInvoiceService
  ) {
  }

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
// Carrega os clientes
  }

  download(payment: Payment) {
    this.paymentInvoiceService.downloadPaymentInvoice(payment);
  }
  onCustomerSelect(customerId: string) {

    if (!customerId || customerId === 'null') {
      return; // 🔥 evita chamada inválida
    }

    this.customerService.getCustomerById(customerId).subscribe(c => {
      this.selectedCustomer = c;
      this.buildDebtMonths();
      this.onNumMonthsChange();
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

  // === Abrir Drawer ===
  openPaymentDrawer() {
    this.isPaymentDrawerVisible = true;
  }


  // === Fechar Drawer ===


  closePaymentDrawer() {
    this.isPaymentDrawerVisible = false;

    this.selectedCustomer = null;
    this.selectedMonths = [];

    this.paymentForm.reset({
      customerId: null,
      amount: null,
      numMonths: 1,
      paymentMethod: null
    });
  }

  buildDebtMonths() {
    if (!this.selectedCustomer || !this.selectedCustomer.monthsInDebt) return;

    const today = new Date();
    const currentMonth = today.getMonth();

    const monthsInDebt = this.selectedCustomer.monthsInDebt;

    const monthNames = [
      'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
      'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];

    this.debtMonths = [];

    // ✅ CORRETO (sem +1)
    const startIndex = (currentMonth - monthsInDebt + 12) % 12;

    for (let i = 0; i < monthsInDebt; i++) {
      const index = (startIndex + i) % 12;
      this.debtMonths.push(monthNames[index]);
    }
  }

  savePayment() {
    if (this.paymentForm.invalid) {
      this.message.warning('Preencha todos os campos corretamente ⚠️');
      return;
    }

    const payload = {
      ...this.paymentForm.value,
      months: this.selectedMonths
    };

    this.isLoading = true;

    this.paymentService.addPayment(payload).subscribe({

      next: () => {
        this.message.success('Pagamento registado com sucesso! 💧💰');
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



  // ========= Navigation =========
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
      console.log(this.dataSource)
      this.listOfDisplayData = [...this.dataSource];
      this.calculatePaymentStats();
      this.isLoading = false;
    });
  }



  viewPayment(data: Payment) {
  }

  onNumMonthsChange() {
    const num = this.paymentForm.get('numMonths')?.value || 1;
    const max = this.selectedCustomer?.monthsInDebt || 1;

    if (num < 1) {
      this.paymentForm.get('numMonths')?.setValue(1);
      this.selectedMonths = this.debtMonths.slice(0, 1);
    } else if (num > max) {
      this.paymentForm.get('numMonths')?.setValue(max);
      this.selectedMonths = this.debtMonths.slice(0, max);
    } else {
      this.selectedMonths = this.debtMonths.slice(0, num);
    }
  }





  private formatDateOnly(value: string): string {
    const date = new Date(value);
    const dd = String(date.getDate()).padStart(2, '0');
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const yyyy = date.getFullYear();
    return `${dd}/${mm}/${yyyy}`;
  }

  private formatMoney(value: number): string {
    return Number(value || 0).toFixed(2);
  }


  deletePayment(data: Payment) {

  }
}


/* No HTML, adicione o evento (input) ao campo de pesquisa: */
// <input class="input-flex" nz-input placeholder="Search by customer name" type="text" [(ngModel)]="searchValue" (input)="filterData()"/>
