import {Component, OnInit} from '@angular/core';
import {FormControl, FormGroup, Validators} from '@angular/forms';
import {Payment} from '../../models/WSM/payment';
import {CustomerService} from '../../services/customer.service';
import {PaymentService} from '../../services/payment.service';
import {Customer} from '../../models/CSM/customer';
import {Recibo} from '../../models/WSM/Recibo';
import {ReciboService} from '../../services/recibo.service';
import {NzMessageService} from 'ng-zorro-antd/message';
import {NzModalService} from 'ng-zorro-antd/modal';


@Component({
  selector: 'app-payment',
  standalone: false,
  templateUrl: './payment.component.html',
  styleUrls: ['./payment.component.scss'],
})
export class PaymentComponent implements OnInit {
  dataCostumers: Customer[] = []; // Lista de clientes
  dataSource: Payment[] = []; // Inicializado como array vazio
  listOfDisplayData: Payment[] = [];

  totalPayments = 0;
  confirmedPayments = 0;
  unconfirmedPayments = 0;

  searchValue = '';
  visible = false;
  visible1 = false;
  visible1CustomerDrawer = false;// Controla a visibilidade do modal

  paymentForm = new FormGroup({
    amount: new FormControl('', [Validators.required, Validators.min(0)]),
    numMonths: new FormControl('', Validators.required),
    paymentMethod: new FormControl('', Validators.required),
    confirmed: new FormControl(false),
    customerId: new FormControl('', Validators.required), // Campo para o ID do Cliente
  });
  customerForm = new FormGroup({
    name: new FormControl('', Validators.required),
    contact: new FormControl('', [Validators.required, Validators.pattern('^[0-9]+$')]),
    address: new FormControl('', Validators.required),
    status: new FormControl('ATIVO', Validators.required),
    valve: new FormControl(10, [Validators.required, Validators.min(0)]),
    monthsInDebt: new FormControl(1, [Validators.required, Validators.min(0)])
  });

  constructor(
    private paymentService: PaymentService,
    private customerService: CustomerService,
    private reciboService: ReciboService,
    private message: NzMessageService,
    private modal: NzModalService
  ) {
  }

  ngOnInit(): void {
    this.getPayments();
    this.getCustomers(); // Carrega os clientes
  }

  getPayments() {
    this.paymentService.getPayments().subscribe((payments: Payment[]) => {
      this.dataSource = payments;
      this.listOfDisplayData = [...this.dataSource]; // Atualiza após receber os dados
      this.calculatePaymentStats();
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

  filterData(): void {
    this.listOfDisplayData = this.dataSource.filter((item: Payment) => {
      const customer = this.dataCostumers.find(c => c.id === item.customerId);
      return customer?.name.toLowerCase().includes(this.searchValue.toLowerCase());
    });
  }

  open(): void {
    this.visible1 = true;
  }

  openCustomerDrawer(): void {
    this.visible1CustomerDrawer = true;
  }

  close(): void {
    this.visible1 = false;
  }

  closeCustomerDrawer(): void {
    this.visible1CustomerDrawer = false;
  }

  getCustomers() {
    this.customerService.getCustomers().subscribe((customers: Customer[]) => {
      this.dataCostumers = customers;
    });
  }

  printPayment(payment: Payment): void {
    this.paymentService.printInvoice(payment.id).subscribe({})
  }

  getDownloadUrl(recibo: Recibo) {
    this.reciboService.downloadRecibo(recibo.id).subscribe((fileBlob: Blob) => {
      const url = window.URL.createObjectURL(fileBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = recibo.fileName; // ou qualquer nome
      a.click();
      window.URL.revokeObjectURL(url);
    });
  }

  createCustomer() {
    if (this.customerForm.invalid) {
      console.error('Formulário inválido.');
      return;
    }


    this.customerService.addCustomer(this.customerForm.value).subscribe({
      next: (newCustomer) => {
        console.log('Cliente criado com sucesso:', newCustomer);
        this.listOfDisplayData = [...this.dataSource];
        this.customerForm.reset({status: 'ATIVO', valve: 10, monthsInDebt: 1});
        this.close();
      },
      error: (err) => {
        console.error('Erro ao adicionar cliente:', err);
      }
    });
  }

  createRecibo(payment: Payment) {

    {
      this.reciboService.addRecibo(payment.id).subscribe({
        next: (newRecibo) => {
          this.message.success('Recibo criado com sucesso! ✅');
        },
        error: () => {
          this.message.error('Erro ao criar recibo. 🚫');
        }
      });
    }
  }

  public createPayment() {
    if (this.paymentForm.invalid) {
      console.error('Erro: O formulário contém campos inválidos.');
      return;
    }

    this.paymentService.addPayment(this.paymentForm.value).subscribe({
      next: (newPayment) => {
        console.log('Form Data:', this.paymentForm.value);
        console.log('Pagamento adicionado com sucesso:', newPayment);
        this.getPayments();
        this.dataSource = [...this.dataSource, newPayment];
        this.listOfDisplayData = [...this.dataSource]; // Atualiza a tabela
        this.calculatePaymentStats(); // Atualiza os dados estatísticos
        this.paymentForm.reset({confirmed: false}); // Reseta o formulário
        this.close(); // Fecha o modal
      },
      error: (err) => {
        console.error('Erro ao adicionar pagamento:', err);
      },
    });
  }

  deletePayment(data: Payment) {
  }

  editPayment(data: Payment) {
  }

  viewPayment(data: Payment) {
  }
}


/* No HTML, adicione o evento (input) ao campo de pesquisa: */
// <input class="input-flex" nz-input placeholder="Search by customer name" type="text" [(ngModel)]="searchValue" (input)="filterData()"/>
