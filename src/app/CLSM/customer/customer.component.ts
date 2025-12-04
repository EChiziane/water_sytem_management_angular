import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { CustomerService } from '../../services/customer.service';
import { Customer } from '../../models/CSM/customer';
import { PaymentService } from '../../services/payment.service';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzModalService } from 'ng-zorro-antd/modal';

@Component({
  selector: 'app-customer',
  standalone: false,
  templateUrl: './customer.component.html',
  styleUrls: ['./customer.component.scss']
})
export class CustomerComponent implements OnInit {

  // ========= Data =========
  dataSource: Customer[] = [];
  listOfDisplayData: Customer[] = [];
  dataCostumers: Customer[] = [];

  totalCustomers = 0;
  activeCustomers = 0;
  inactiveCustomers = 0;
  isLoading = false;

  // ========= UI State =========
  searchValue = '';
  visible = false;
  isCustomerDrawerVisible = false;
  paymentDrawerVisible = false;

  // ========= Edit State =========
  isEditMode = false;
  customerDrawerTitle = 'Criar Cliente';
  selectedCustomerId: any | null = null;

  // ========= Forms =========
  customerForm = new FormGroup({
    name: new FormControl('', Validators.required),
    contact: new FormControl('', [Validators.required, Validators.pattern('^[0-9]+$')]),
    address: new FormControl('', Validators.required),
    status: new FormControl('ATIVO', Validators.required),
    valve: new FormControl(10, [Validators.required, Validators.min(0)]),
    monthsInDebt: new FormControl(1, [Validators.required, Validators.min(0)])
  });

  paymentForm = new FormGroup({
    amount: new FormControl('', [Validators.required, Validators.min(0)]),
    numMonths: new FormControl('', Validators.required),
    paymentMethod: new FormControl('', Validators.required),
    confirmed: new FormControl(false),
    customerId: new FormControl('', Validators.required)
  });

  constructor(
    private http: HttpClient,
    private customerService: CustomerService,
    private paymentService: PaymentService,
    private message: NzMessageService,
    private modal: NzModalService
  ) {}

  // ========= Init =========
  ngOnInit(): void {
    this.getCustomers();
  }

  // ========= Customer Logic =========
  getCustomers() {
    this.isLoading = true;
    this.customerService.getCustomers().subscribe(customers => {
      this.dataSource = customers;
      this.dataCostumers = customers;
      this.listOfDisplayData = [...customers];
      this.calculateCustomerStats();
      this.isLoading = false;
    });
  }

  calculateCustomerStats() {
    this.totalCustomers = this.dataSource.length;
    this.activeCustomers = this.dataSource.filter(c => c.status === 'ATIVO').length;
    this.inactiveCustomers = this.dataSource.filter(c => c.status === 'INATIVO').length;
  }

  editCustomer(customer: Customer) {
    this.isEditMode = true;
    this.customerDrawerTitle = 'Editar Cliente';
    this.selectedCustomerId = customer.id;
    this.isCustomerDrawerVisible = true;

    this.customerForm.patchValue({
      name: customer.name,
      contact: customer.contact,
      address: customer.address,
      status: customer.status,
      valve: customer.valve,
      monthsInDebt: customer.monthsInDebt
    });
  }

  createCustomer() {
    if (this.customerForm.invalid) {
      this.message.warning('Preencha todos os campos obrigatórios!');
      return;
    }

    const formData = this.customerForm.value;

    if (this.isEditMode && this.selectedCustomerId) {
      this.customerService.updateCustomer(this.selectedCustomerId, formData).subscribe({
        next: () => {
          this.getCustomers();
          this.closeCustomerDrawer();
          this.message.success('Cliente atualizado com sucesso! ✅');
        },
        error: () => this.message.error('Erro ao atualizar cliente. 🚫')
      });
      return;
    }

    this.customerService.addCustomer(formData).subscribe({
      next: (newCustomer) => {
        this.dataSource = [...this.dataSource, newCustomer];
        this.listOfDisplayData = [...this.dataSource];
        this.calculateCustomerStats();
        this.customerForm.reset({ status: 'ATIVO', valve: 10, monthsInDebt: 1 });
        this.closeCustomerDrawer();
        this.message.success('Cliente criado com sucesso! ✅');
      },
      error: () => this.message.error('Erro ao criar cliente. 🚫')
    });
  }

  deleteCustomer(data: Customer) {
    this.modal.confirm({
      nzTitle: 'Tens certeza que quer eliminar este Cliente?',
      nzContent: `Cliente: <strong>${data.name}</strong>`,
      nzOkText: 'Sim',
      nzOkType: 'primary',
      nzCancelText: 'Não',
      nzOnOk: () =>
        this.customerService.deleteCustomer(data.id).subscribe({
          next: () => {
            this.getCustomers();
            this.message.success('Cliente deletado com sucesso! 🗑️');
          },
          error: () => this.message.error('Erro ao deletar cliente. 🚫')
        })
    });
  }

  viewCustomer(data: Customer) {
    console.log('Visualizar cliente:', data);
  }

  // ========= Search =========
  reset() {
    this.searchValue = '';
    this.search();
  }

  search() {
    this.visible = false;
    this.listOfDisplayData = this.dataSource.filter(item =>
      item.name.toLowerCase().includes(this.searchValue.toLowerCase())
    );
  }

  // ========= Drawer Controls =========
  open() {
    this.isEditMode = false;
    this.customerDrawerTitle = 'Criar Cliente';
    this.customerForm.reset({ status: 'ATIVO', valve: 10, monthsInDebt: 1 });
    this.isCustomerDrawerVisible = true;
  }

  closeCustomerDrawer() {
    this.isCustomerDrawerVisible = false;
    this.customerForm.reset();
    this.selectedCustomerId = null;
  }

  openPaymentDrawer() {
    this.paymentDrawerVisible = true;
  }

  closePaymentDrawer() {
    this.paymentDrawerVisible = false;
    this.paymentForm.reset();
  }

  // ========= Payment =========
  createPayment() {
    if (this.paymentForm.invalid) {
      this.message.warning('Preencha todos os campos obrigatórios do pagamento!');
      return;
    }

    this.paymentService.addPayment(this.paymentForm.value).subscribe({
      next: (newPayment) => {
        console.log('Pagamento adicionado:', newPayment);
        this.paymentForm.reset({ confirmed: false });
        this.closePaymentDrawer();
        this.message.success('Pagamento registrado com sucesso! 💰');
      },
      error: () => this.message.error('Erro ao registrar pagamento. 🚫')
    });
  }

  // ========= Navigation =========
  onBack() {
    window.history.back();
  }
}
