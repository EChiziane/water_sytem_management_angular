import {Component, OnInit} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {FormControl, FormGroup, Validators} from '@angular/forms';
import {CustomerService} from '../../services/customer.service';
import {Customer} from '../../models/WSM/customer';
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

  // ========= Data =========
  dataSource: Customer[] = [];
  listOfDisplayData: Customer[] = [];
  dataCostumers: Customer[] = [];

  totalCustomers = 0;
  debtorsCustomers = 0;
  regularCustomers = 0;
  isLoading = false;

  // ========= UI State =========
  searchValue = '';
  visible = false;
  isCustomerDrawerVisible = false;
  paymentDrawerVisible = false;

  // ===== Debt Filter =====
  debtFilter: 'ALL' | 'DEBT' | 'CLEAR' = 'ALL';

  // ========= Edit State =========
  isEditMode = false;
  customerDrawerTitle = 'Criar Cliente';
  selectedCustomerId: any | null = null;

  drawerWidth: string | number = 720;
  drawerPlacement: 'right' | 'bottom' = 'right';

  // ========= Forms =========
  customerForm = new FormGroup({
    name: new FormControl('', Validators.required),
    contact: new FormControl('', [Validators.required, Validators.pattern('^[+0-9 ]+$')]),
    address: new FormControl('', Validators.required),
    status: new FormControl('ATIVO', Validators.required),
    valve: new FormControl(10, [Validators.required, Validators.min(0)]),
    monthlyFee: new FormControl(750),
    monthsInDebt: new FormControl(1, [Validators.required, Validators.min(0)])
  });



  constructor(
    private http: HttpClient,
    private customerService: CustomerService,
    private paymentService: PaymentService,
    private message: NzMessageService,
    private modal: NzModalService
  ) {
  }

  // ========= Init =========
  ngOnInit(): void {
    this.getCustomers();
    this.updateDrawer();
    window.addEventListener('resize', () => this.updateDrawer());
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

  applyFilters() {
    let data = [...this.dataSource];

    // --- Filter by name ---
    if (this.searchValue) {
      data = data.filter(item =>
        item.name.toLowerCase().includes(this.searchValue.toLowerCase())
      );
    }

    // --- Filter by debt ---
    if (this.debtFilter === 'DEBT') {
      data = data.filter(item => item.monthsInDebt > 0);
    }

    if (this.debtFilter === 'CLEAR') {
      data = data.filter(item => item.monthsInDebt === 0);
    }

    this.listOfDisplayData = data;
  }


  calculateCustomerStats() {
    this.totalCustomers = this.dataSource.length;

    this.debtorsCustomers = this.dataSource.filter(
      c => c.monthsInDebt && c.monthsInDebt > 0
    ).length;

    this.regularCustomers = this.dataSource.filter(
      c => !c.monthsInDebt || c.monthsInDebt === 0
    ).length;
  }

  search() {
    this.visible = false;
    this.applyFilters();
  }

  filterByDebt(value: 'ALL' | 'DEBT' | 'CLEAR') {
    this.debtFilter = value;
    this.applyFilters();
  }



  editCustomer(customer: Customer) {
    this.isEditMode = true;
    this.customerDrawerTitle = 'Editar Cliente';
    this.selectedCustomerId = customer.id;
    this.isCustomerDrawerVisible = true;

    this.customerForm.patchValue({
      name: customer.name,
      monthlyFee: customer.monthlyFee,
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

    // --- Garantir Contacto +258 ---
    const rawContact = formData.contact?.trim();
    formData.contact = rawContact!.startsWith('+258')
      ? rawContact
      : `+258 ${rawContact}`;

    // --- Garantir Monthly Fee Default ---
    if (!formData.monthlyFee || formData.monthlyFee === null) {
      formData.monthlyFee = 750;
    }

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
        this.customerForm.reset({ status: 'ATIVO', valve: 10, monthsInDebt: 1, monthlyFee: 750 });
        this.closeCustomerDrawer();
        this.message.success('Cliente criado com sucesso! 🎉');
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


  // ========= Drawer Controls =========
  openCustomerDrawer() {
    this.isEditMode = false;
    this.customerDrawerTitle = 'Criar Cliente';
    this.customerForm.reset(
      {status: 'ATIVO',
        valve: 10,
        monthlyFee: 750,
        monthsInDebt: 1});
    this.isCustomerDrawerVisible = true;
  }

  closeCustomerDrawer() {
    this.isCustomerDrawerVisible = false;
    this.customerForm.reset();
    this.selectedCustomerId = null;
  }



  // ========= Navigation =========
  onBack() {
    window.history.back();
  }
}
