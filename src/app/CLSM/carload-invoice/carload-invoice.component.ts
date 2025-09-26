import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { CarloadInvoiceService } from '../../services/carloadInvoiceService';
import { CarloadCustomerService } from '../../services/carload-customer.service';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzModalService } from 'ng-zorro-antd/modal';
import { CarloadInvoice } from '../../models/CSM/carloadInvoice';
import { CarloadCustomer } from '../../models/CSM/carload-customer';

@Component({
  selector: 'app-carload-invoice',
  templateUrl: './carload-invoice.component.html',
  styleUrls: ['./carload-invoice.component.scss'],
  standalone:false
})
export class CarloadInvoiceComponent implements OnInit {

  invoices: CarloadInvoice[] = [];
  dataCustomer: CarloadCustomer[] = [];
  invoiceForm!: FormGroup;
  isDrawerVisible = false;
  currentInvoiceId: string | null = null;
  searchValue = '';

  itemsOptions: string[] = [
    "M4_AREIA_GROSSA", "M4_PEDRA_3_4", "M4_PEDRA_SARRISCA", "M4_PO_DE_PEDRA", "M4_AREIA_FINA",
    "M7_AREIA_GROSSA", "M7_PEDRA_3_4", "M7_PEDRA_SARRISCA", "M7_PO_DE_PEDRA", "M7_AREIA_FINA",
    "M18_AREIA_GROSSA", "M18_PEDRA_3_4", "M18_PEDRA_SARRISCA", "M18_PO_DE_PEDRA", "M18_AREIA_FINA",
    "M20_AREIA_GROSSA", "M20_PEDRA_3_4", "M20_PEDRA_SARRISCA", "M20_PO_DE_PEDRA", "M20_AREIA_FINA",
    "M22_AREIA_GROSSA", "M22_PEDRA_3_4", "M22_PEDRA_SARRISCA", "M22_PO_DE_PEDRA", "M22_AREIA_FINA"
  ];

  constructor(
    private fb: FormBuilder,
    private invoiceService: CarloadInvoiceService,
    private customerService: CarloadCustomerService,
    private message: NzMessageService,
    private modal: NzModalService
  ) {}

  ngOnInit(): void {
    this.loadInvoices();
    this.loadCustomers();
    this.initForm();
  }

  private loadInvoices() {
    this.invoiceService.getInvoices().subscribe(data => this.invoices = data);
  }

  private loadCustomers() {
    this.customerService.getCustomers().subscribe(data => this.dataCustomer = data);
  }

  private initForm() {
    this.invoiceForm = this.fb.group({
      carloadCustomerId: ['', Validators.required],
      invoiceCode: ['', Validators.required],
      items: this.fb.array([]),
      taxRate: [0.1, Validators.required],
      subtotal: [{ value: 0, disabled: true }],
      tax: [{ value: 0, disabled: true }],
      total: [{ value: 0, disabled: true }]
    });

    // Recalcular totals quando a taxa mudar
    this.invoiceForm.get('taxRate')?.valueChanges.subscribe(() => this.calculateTotals());
  }

  get items(): FormArray {
    return this.invoiceForm.get('items') as FormArray;
  }

  addItem() {
    const itemGroup = this.fb.group({
      description: ['', Validators.required],
      quantity: [0, [Validators.required, Validators.min(1)]],
      unitPrice: [0, [Validators.required, Validators.min(0)]],
      amount: [{ value: 0, disabled: true }]
    });

    itemGroup.get('quantity')?.valueChanges.subscribe(() => this.updateItemAmount(itemGroup));
    itemGroup.get('unitPrice')?.valueChanges.subscribe(() => this.updateItemAmount(itemGroup));

    this.items.push(itemGroup);
  }

  private updateItemAmount(itemGroup: FormGroup) {
    const quantity = itemGroup.get('quantity')?.value || 0;
    const unitPrice = itemGroup.get('unitPrice')?.value || 0;
    const amount = quantity * unitPrice;
    itemGroup.patchValue({ amount }, { emitEvent: false });
    this.calculateTotals();
  }

  removeItem(index: number) {
    this.items.removeAt(index);
    this.calculateTotals();
  }

  private calculateTotals() {
    const subtotal = this.items.controls.reduce((sum, item) => {
      const amount = item.get('amount')?.value || 0;
      return sum + amount;
    }, 0);
    const taxRate = this.invoiceForm.get('taxRate')?.value || 0;
    const tax = subtotal * taxRate;
    const total = subtotal + tax;

    this.invoiceForm.patchValue({ subtotal, tax, total }, { emitEvent: false });
  }

  openDrawer(): void {
    this.isDrawerVisible = true;
    this.currentInvoiceId = null;
    this.invoiceForm.reset({ taxRate: 0.1 });
    this.items.clear();
    this.addItem(); // um item por default
  }

  closeDrawer(): void {
    this.isDrawerVisible = false;
    this.invoiceForm.reset({ taxRate: 0.1 });
    this.items.clear();
    this.currentInvoiceId = null;
  }

  submitInvoice(): void {
    if (!this.invoiceForm.valid) return;
    const invoiceData = this.invoiceForm.getRawValue();

    if (this.currentInvoiceId) {
      this.invoiceService.updateInvoice(this.currentInvoiceId, invoiceData).subscribe({
        next: () => { this.loadInvoices(); this.closeDrawer(); this.message.success('Invoice updated ✅'); },
        error: () => this.message.error('Error updating invoice 🚫')
      });
    } else {
      this.invoiceService.addInvoice(invoiceData).subscribe({
        next: () => { this.loadInvoices(); this.closeDrawer(); this.message.success('Invoice created ✅'); },
        error: () => this.message.error('Error creating invoice 🚫')
      });
    }
  }

  editInvoice(invoice: CarloadInvoice) {
    this.currentInvoiceId = invoice.id;
    this.isDrawerVisible = true;

    this.items.clear();
    invoice.items.forEach(it => {
      const group = this.fb.group({
        description: [it.description, Validators.required],
        quantity: [it.quantity, Validators.required],
        unitPrice: [it.unitPrice, Validators.required],
        amount: [{ value: it.quantity * it.unitPrice, disabled: true }]
      });
      group.get('quantity')?.valueChanges.subscribe(() => this.updateItemAmount(group));
      group.get('unitPrice')?.valueChanges.subscribe(() => this.updateItemAmount(group));
      this.items.push(group);
    });

    this.invoiceForm.patchValue({
      carloadCustomerId: invoice.carloadCustomerId,
      invoiceCode: invoice.invoiceCode,
      taxRate: invoice.taxRate
    });

    this.calculateTotals();
  }

  deleteInvoice(invoice: CarloadInvoice) {
    this.modal.confirm({
      nzTitle: 'Are you sure you want to delete this invoice?',
      nzContent: `<b>${invoice.invoiceCode}</b>`,
      nzOkText: 'Yes',
      nzCancelText: 'No',
      nzOnOk: () => {
        this.invoiceService.deleteInvoice(invoice.id).subscribe({
          next: () => { this.loadInvoices(); this.message.success('Invoice deleted 🗑️'); },
          error: () => this.message.error('Error deleting invoice 🚫')
        });
      }
    });
  }

  search(): void {
    const val = this.searchValue.toLowerCase();
    if (!val) { this.loadInvoices(); return; }
    this.invoices = this.invoices.filter(inv =>
      inv.invoiceCode.toLowerCase().includes(val) ||
      inv.items.some((it: any) => it.description.toLowerCase().includes(val))
    );
  }

  downloadInvoice(invoice: CarloadInvoice) {
    this.invoiceService.downloadRecibo(invoice.id).subscribe((fileBlob: Blob) => {
      const url = window.URL.createObjectURL(fileBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = invoice.filePath || 'invoice.xlsx';
      a.click();
      window.URL.revokeObjectURL(url);
    });
  }
}
