import {Component, HostListener, OnInit} from '@angular/core';
import {FormControl, FormGroup, Validators} from '@angular/forms';
import {finalize} from 'rxjs';
import {Customer} from '@shared/models/WSM/customer';
import {CustomerPayload, CustomerService} from '@core/services/customer.service';
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

  isSaving = false;
  isLoading = false;

  searchValue = '';
  visible = false;
  isCustomerDrawerVisible = false;

  debtFilter: 'ALL' | 'DEBT' | 'CLEAR' = 'ALL';

  isEditMode = false;
  customerDrawerTitle = 'Criar Cliente';
  selectedCustomerId: string | null = null;

  drawerWidth: string | number = 720;
  drawerPlacement: 'right' | 'bottom' = 'right';

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
    private customerService: CustomerService,
    private message: NzMessageService,
    private modal: NzModalService
  ) {
  }

  ngOnInit(): void {
    this.getCustomers();
    this.updateDrawer();
  }

  @HostListener('window:resize')
  onResize(): void {
    this.updateDrawer();
  }

  updateDrawer(): void {
    if (window.innerWidth <= 768) {
      this.drawerWidth = '100%';
      this.drawerPlacement = 'bottom';
      return;
    }

    this.drawerWidth = 720;
    this.drawerPlacement = 'right';
  }

  getCustomers(): void {
    this.isLoading = true;

    this.customerService.getCustomers()
      .pipe(finalize(() => this.isLoading = false))
      .subscribe({
        next: customers => {
          this.dataSource = customers;
          this.listOfDisplayData = [...customers];
        },
        error: () => this.message.error('Erro ao carregar clientes.')
      });
  }

  applyFilters(): void {
    let data = [...this.dataSource];

    if (this.searchValue) {
      data = data.filter(item =>
        item.name.toLowerCase().includes(this.searchValue.toLowerCase())
      );
    }

    if (this.debtFilter === 'DEBT') {
      data = data.filter(item => item.monthsInDebt > 0);
    }

    if (this.debtFilter === 'CLEAR') {
      data = data.filter(item => item.monthsInDebt === 0);
    }

    this.listOfDisplayData = data;
  }

  search(): void {
    this.visible = false;
    this.applyFilters();
  }

  filterByDebt(value: 'ALL' | 'DEBT' | 'CLEAR'): void {
    this.debtFilter = value;
    this.applyFilters();
  }

  editCustomer(customer: Customer): void {
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

  createCustomer(): void {
    if (this.customerForm.invalid) {
      this.message.warning('Preencha todos os campos obrigatórios!');
      return;
    }

    this.isSaving = true;
    const value = this.customerForm.value;
    const formData: CustomerPayload = {
      name: value.name ?? '',
      contact: value.contact ?? '',
      address: value.address ?? '',
      status: value.status ?? 'ATIVO',
      valve: value.valve ?? 10,
      monthlyFee: value.monthlyFee ?? 750,
      monthsInDebt: value.monthsInDebt ?? 1
    };
    const rawContact = formData.contact?.trim();

    formData.contact = rawContact?.startsWith('+258')
      ? rawContact
      : `+258 ${rawContact}`;

    if (!formData.monthlyFee) {
      formData.monthlyFee = 750;
    }

    const request$ = this.isEditMode && this.selectedCustomerId
      ? this.customerService.updateCustomer(this.selectedCustomerId, formData)
      : this.customerService.addCustomer(formData);

    request$.pipe(finalize(() => this.isSaving = false)).subscribe({
      next: () => {
        this.getCustomers();
        this.closeCustomerDrawer();
        this.message.success(
          this.isEditMode
            ? 'Cliente atualizado com sucesso!'
            : 'Cliente criado com sucesso!'
        );
      },
      error: () => this.message.error('Erro ao gravar cliente.')
    });
  }

  deleteCustomer(data: Customer): void {
    this.modal.confirm({
      nzTitle: 'Tens certeza que quer eliminar este cliente?',
      nzContent: `Cliente: <strong>${data.name}</strong>`,
      nzOkText: 'Sim',
      nzOkType: 'primary',
      nzOkDanger: true,
      nzCancelText: 'Não',
      nzOnOk: () =>
        this.customerService.deleteCustomer(data.id).subscribe({
          next: () => {
            this.getCustomers();
            this.message.success('Cliente deletado com sucesso!');
          },
          error: () => this.message.error('Erro ao deletar cliente.')
        })
    });
  }

  viewCustomer(_data: Customer): void {
  }

  reset(): void {
    this.searchValue = '';
    this.search();
  }

  openCustomerDrawer(): void {
    this.isEditMode = false;
    this.customerDrawerTitle = 'Criar Cliente';
    this.customerForm.reset({
      status: 'ATIVO',
      valve: 10,
      monthlyFee: 750,
      monthsInDebt: 1
    });
    this.isCustomerDrawerVisible = true;
  }

  closeCustomerDrawer(): void {
    this.isCustomerDrawerVisible = false;
    this.customerForm.reset();
    this.selectedCustomerId = null;
  }

  onBack(): void {
    window.history.back();
  }
}
