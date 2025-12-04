import {Component, OnInit} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {FormControl, FormGroup, Validators} from '@angular/forms';
import {CustomerService} from '../../services/customer.service';
import {Customer} from '../../models/CSM/customer';
import {PaymentService} from '../../services/payment.service';
import {NzMessageService} from 'ng-zorro-antd/message';
import {NzModalService} from 'ng-zorro-antd/modal';

@Component({
  selector: 'app-customer',
  standalone: false,
  templateUrl: './customer.component.html',
  styleUrls: ['./customer.component.scss']
})
export class CustomerComponent implements OnInit {
  dataSource: Customer[] = [];
  listOfDisplayData: Customer[] = [];
  dataCostumers: Customer[] = [];
  totalCustomers = 0;
  activeCustomers = 0;
  inactiveCustomers = 0;

  isLoading = false;

  searchValue = '';
  visible = false;
  isCustomerDrawerVisible = false;

  isEditMode = false;
  customerDrawerTitle = 'Criar Cliente';
  selectedCustomerId: any | null = null;

  customerForm = new FormGroup({
    name: new FormControl('', Validators.required),
    contact: new FormControl('', [Validators.required, Validators.pattern('^[0-9]+$')]),
    address: new FormControl('', Validators.required),
    status: new FormControl('ATIVO', Validators.required),
    valve: new FormControl(10, [Validators.required, Validators.min(0)]),
    monthsInDebt: new FormControl(1, [Validators.required, Validators.min(0)])
  });

  paymentDrawerVisible = false;
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
  ) {
  }

  ngOnInit(): void {
    this.getCustomers();
  }

  getCustomers() {
    this.isLoading = true;
    this.customerService.getCustomers().subscribe((customers: Customer[]) => {
      this.dataSource = customers;
      this.isLoading = false;
      this.dataCostumers = customers;
      this.listOfDisplayData = [...this.dataSource];
      this.calculateCustomerStats();
    });
  }

  calculateCustomerStats() {
    this.totalCustomers = this.dataSource.length;
    this.activeCustomers = this.dataSource.filter(c => c.status === 'ATIVO').length;
    this.inactiveCustomers = this.dataSource.filter(c => c.status === 'INATIVO').length;
  }

  reset(): void {
    this.searchValue = '';
    this.search();
  }

  search(): void {
    this.visible = false;
    this.listOfDisplayData = this.dataSource.filter(
      (item: Customer) => item.name.toLowerCase().includes(this.searchValue.toLowerCase())
    );
  }

  open(): void {
    this.isEditMode = false;
    this. customerDrawerTitle = 'Criar Cliente';
    this.customerForm.reset({status: 'ATIVO', valve: 10, monthsInDebt: 1});
    this.  isCustomerDrawerVisible= true;
  }

  openPaymentDrawer(): void {
    this.paymentDrawerVisible = true;
  }

  closeCustomerDrawer(): void {
    this.  isCustomerDrawerVisible = false;
    this.customerForm.reset();
    this.selectedCustomerId = null;
  }

  closePaymentDrawer(): void {
    this.paymentDrawerVisible = false;
    this.paymentForm.reset();
  }

  createCustomer() {
    if (this.customerForm.invalid) {
      this.message.warning('Preencha todos os campos obrigatórios!');
      return;
    }

    if (this.isEditMode && this.selectedCustomerId) {
      this.customerService.updateCustomer(this.selectedCustomerId, this.customerForm.value).subscribe({
        next: (updatedCustomer) => {
          this.getCustomers();
          this.closeCustomerDrawer();
          this.message.success('Cliente atualizado com sucesso! ✅');
        },
        error: () => {
          this.message.error('Erro ao atualizar cliente. 🚫');
        }
      });
    } else {
      this.customerService.addCustomer(this.customerForm.value).subscribe({
        next: (newCustomer) => {
          this.dataSource = [...this.dataSource, newCustomer];
          this.listOfDisplayData = [...this.dataSource];
          this.calculateCustomerStats();
          this.customerForm.reset({status: 'ATIVO', valve: 10, monthsInDebt: 1});
          this.closeCustomerDrawer();
          this.message.success('Cliente criado com sucesso! ✅');
        },
        error: () => {
          this.message.error('Erro ao criar cliente. 🚫');
        }
      });
    }
  }

  editCustomer(customer: Customer): void {
    this.isEditMode = true;
    this. customerDrawerTitle = 'Editar Cliente';
    this.selectedCustomerId = customer.id;
    this.  isCustomerDrawerVisible = true;

    this.customerForm.patchValue({
      name: customer.name,
      contact: customer.contact,
      address: customer.address,
      status: customer.status,
      valve: customer.valve,
      monthsInDebt: customer.monthsInDebt
    });
  }

  viewCustomer(data: Customer) {
    console.log('Visualizar cliente:', data);
  }

  deleteCustomer(data: Customer) {
    this.modal.confirm({
      nzTitle: 'Tens certeza que quer eliminar este Cliente?',
      nzContent: `Cliente: <strong>${data.name}</strong>`,
      nzOkText: 'Sim',
      nzOkType: 'primary',
      nzCancelText: 'Não',
      nzOnOk: () => {
        this.customerService.deleteCustomer(data.id).subscribe({
          next: () => {
            this.getCustomers();
            this.message.success('Cliente deletado com sucesso! 🗑️');
          },
          error: () => {
            this.message.error('Erro ao deletar cliente. 🚫');
          }
        });
      }
    });
  }


  onBack() {
    window.history.back();
  }

  public createPayment() {
    if (this.paymentForm.invalid) {
      this.message.warning('Preencha todos os campos obrigatórios do pagamento!');
      return;
    }

    this.paymentService.addPayment(this.paymentForm.value).subscribe({
      next: (newPayment) => {
        console.log('Form Data:', this.paymentForm.value);
        console.log('Pagamento adicionado com sucesso:', newPayment);
        this.paymentForm.reset({confirmed: false});
        this.closePaymentDrawer();

        this.message.success('Pagamento registrado com sucesso! 💰');
      },
      error: () => {
        this.message.error('Erro ao registrar pagamento. 🚫');
      }
    });
  }
}
