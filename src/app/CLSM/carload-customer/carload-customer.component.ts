import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzModalService } from 'ng-zorro-antd/modal';
import { CarloadCustomerService } from '../../services/carload-customer.service';
import { CarloadCustomer } from '../../models/CSM/carload-customer';

@Component({
  selector: 'app-carload-customer',
  templateUrl: './carload-customer.component.html',
  styleUrls: ['./carload-customer.component.scss'],
  standalone: false,
})
export class CarloadCustomerComponent implements OnInit {
  customers: CarloadCustomer[] = [];
  isDrawerVisible = false;
  searchValue = '';
  currentEditingCustomerId: string | null = null;
  customerForm!: FormGroup;

  editingCustomer?: CarloadCustomer | null = null;
  editingField?: string | null = null;
  isLoading = false;

  constructor(
    private customerService: CarloadCustomerService,
    private fb: FormBuilder,
    private message: NzMessageService,
    private modal: NzModalService
  ) {
    this.initForm();
  }

  get drawerTitle(): string {
    return this.currentEditingCustomerId ? 'Editar Cliente' : 'Novo Cliente';
  }

  ngOnInit(): void {
    this.loadCustomers();

  }

  openDrawer(): void {
    this.isDrawerVisible = true;
    this.currentEditingCustomerId = null;
    this.customerForm.reset();
  }

  closeDrawer(): void {
    this.isDrawerVisible = false;
    this.customerForm.reset();
    this.currentEditingCustomerId = null;
  }



  editCustomer(customer: CarloadCustomer): void {
    this.currentEditingCustomerId = customer.id;
    this.customerForm.patchValue({ ...customer });
    this.isDrawerVisible = true;
  }

  deleteCustomer(customer: CarloadCustomer): void {
    this.modal.confirm({
      nzTitle: 'Tem certeza que deseja eliminar este cliente?',
      nzContent: `<strong>${customer.name}</strong>`,
      nzOkText: 'Sim',
      nzCancelText: 'Não',
      nzOnOk: () => {
        this.customerService.deleteCustomer(customer.id).subscribe({
          next: () => {
            this.loadCustomers();
            this.message.success('Cliente eliminado com sucesso! 🗑️');
          },
          error: () => this.message.error('Erro ao eliminar cliente 🚫'),
        });
      },
    });
  }

  /* -------------------- Inline Edit -------------------- */
  startInlineEdit(customer: CarloadCustomer, field: string): void {
    this.editingCustomer = { ...customer };
    this.editingField = field;
  }

  saveInlineEdit(original: CarloadCustomer, field: string): void {
    if (!this.editingCustomer) return;

    const updated = { ...original, [field]: (this.editingCustomer as any)[field] };
    this.customerService.updateCustomer(original.id, updated).subscribe({
      next: () => {
        Object.assign(original, updated);
        this.message.success(`Campo ${field} atualizado! ✅`);
        this.resetInlineEdit();
      },
      error: () => {
        this.message.error('Erro ao atualizar campo 🚫');
        this.resetInlineEdit();
      },
    });
  }

  private resetInlineEdit(): void {
    this.editingCustomer = null;
    this.editingField = null;
  }

  search(): void {
    const val = this.searchValue.toLowerCase();
    if (!val) {
      this.loadCustomers();
      return;
    }
    this.customers = this.customers.filter(
      (c) =>
        c.name.toLowerCase().includes(val) ||
        c.customerCode.toLowerCase().includes(val) ||
        c.emailAddress.toLowerCase().includes(val) ||
        c.phoneNumber.toLowerCase().includes(val)
    );
  }


  // Default fictitious data
  private defaultCustomerData = {
    customerCode: 'CUST001',
    nuitNumber: '123456789',
    streetAddress: 'Rua Principal',
    city: 'Maputo Cidade',
    zipCode: '12345',
    emailAddress: 'customer@gmail.com',
  };

  submitCustomer(): void {
    if (!this.customerForm.get('name')?.valid || !this.customerForm.get('phoneNumber')?.valid) return;

    // Copia os valores do formulário
    const customerData = { ...this.customerForm.value };




// Preenche dados fictícios para campos vazios
    for (const key of Object.keys(this.defaultCustomerData) as Array<keyof typeof this.defaultCustomerData>) {
      if (!customerData[key] || customerData[key].trim() === '') {
        customerData[key] = this.defaultCustomerData[key];
      }
    }


    if (this.currentEditingCustomerId) {
      this.customerService.updateCustomer(this.currentEditingCustomerId, customerData).subscribe({
        next: () => {
          this.loadCustomers();
          this.closeDrawer();
          this.message.success('Cliente atualizado com sucesso! ✅');
        },
        error: () => this.message.error('Erro ao atualizar cliente 🚫'),
      });
    } else {
      this.customerService.addCustomer(customerData).subscribe({
        next: () => {
          this.loadCustomers();
          this.closeDrawer();
          this.message.success('Cliente criado com sucesso! ✅');
        },
        error: () => this.message.error('Erro ao criar cliente 🚫'),
      });
    }
  }



  private loadCustomers(): void {
    this.isLoading = true;

    this.customerService.getCustomers().subscribe({
      next: (customers) => {
        this.customers = customers;
        console.log(customers)
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
        this.message.error('Erro ao carregar clientes 🚫');
      },
    });
  }



  private initForm(): void {
    this.customerForm = this.fb.group({
      name: ['', Validators.required],
      phoneNumber: ['', Validators.required],
      customerCode: [''],
      nuitNumber: [''],
      streetAddress: [''],
      city: [''],
      zipCode: [''],
      emailAddress: [''],
    });
  }



}
