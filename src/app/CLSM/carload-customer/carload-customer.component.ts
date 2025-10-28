// src/app/components/carload-customer/carload-customer.component.ts
import {Component, OnInit} from '@angular/core';
import {FormBuilder, FormGroup, Validators} from '@angular/forms';
import {NzMessageService} from 'ng-zorro-antd/message';
import {NzModalService} from 'ng-zorro-antd/modal';
import {CarloadCustomerService} from '../../services/carload-customer.service';
import {CarloadCustomer} from '../../models/CSM/carload-customer';


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

  constructor(
    private customerService: CarloadCustomerService,
    private fb: FormBuilder,
    private message: NzMessageService,
    private modal: NzModalService
  ) {
    this.initForm();
  }

  get drawerTitle(): string {
    return this.currentEditingCustomerId ? 'Edit Customer' : 'Add Customer';
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

  submitCustomer(): void {
    if (this.customerForm.valid) {
      const customerData = this.customerForm.value;
      if (this.currentEditingCustomerId) {
        this.customerService.updateCustomer(this.currentEditingCustomerId, customerData)
          .subscribe({
            next: () => {
              this.loadCustomers();
              this.closeDrawer();
              this.message.success('Customer updated successfully!');
            },
            error: () => this.message.error('Error updating customer.')
          });
      } else {
        this.customerService.addCustomer(customerData)
          .subscribe({
            next: () => {
              this.loadCustomers();
              this.closeDrawer();
              this.message.success('Customer created successfully!');
            },
            error: () => this.message.error('Error creating customer.')
          });
      }
    }
  }

  editCustomer(customer: CarloadCustomer): void {
    this.currentEditingCustomerId = customer.id;
    this.customerForm.patchValue({...customer});
    this.isDrawerVisible = true;
  }

  deleteCustomer(customer: CarloadCustomer): void {
    this.modal.confirm({
      nzTitle: 'Are you sure you want to delete this customer?',
      nzContent: `<strong>${customer.name}</strong>`,
      nzOkText: 'Yes',
      nzOkType: 'primary',
      nzCancelText: 'No',
      nzOnOk: () => {
        this.customerService.deleteCustomer(customer.id).subscribe({
          next: () => {
            this.loadCustomers();
            this.message.success('Customer deleted successfully!');
          },
          error: () => this.message.error('Error deleting customer.')
        });
      }
    });
  }

  search(): void {
    const val = this.searchValue.toLowerCase();
    if (!val) {
      this.loadCustomers();
      return;
    }
    this.customers = this.customers.filter(c =>
      c.name.toLowerCase().includes(val) ||
      c.customerCode.toLowerCase().includes(val)
    );
  }

  private loadCustomers(): void {
    this.customerService.getCustomers().subscribe(customers => this.customers = customers);
  }

  private initForm(): void {
    this.customerForm = this.fb.group({
      customerCode: ['', Validators.required],
      name: ['', Validators.required],
      nuitNumber: ['', Validators.required],
      streetAddress: ['', Validators.required],
      city: ['', Validators.required],
      zipCode: ['', Validators.required],
      phoneNumber: ['', Validators.required],
      emailAddress: ['', [Validators.required, Validators.email]]
    });
  }
}
