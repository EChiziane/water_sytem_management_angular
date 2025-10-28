import {Component, OnInit} from '@angular/core';

import {CarloadCustomer} from '../models/CSM/carload-customer';
import {FormArray, FormBuilder, FormGroup, Validators} from '@angular/forms';

import {CarloadCustomerService} from '../services/carload-customer.service';
import {NzMessageService} from 'ng-zorro-antd/message';
import {NzModalService} from 'ng-zorro-antd/modal';
import {CarloadCotacao} from '../models/CSM/carloadInvoice';
import {CarloadCotacaoService} from '../services/carloadcotacao.service';

@Component({
  selector: 'app-carload-cotacao',
  standalone: false,
  templateUrl: './carload-cotacao.component.html',
  styleUrl: './carload-cotacao.component.scss'
})
export class CarloadCotacaoComponent implements OnInit {

  // ===================== PROPRIEDADES =====================
  cotacoes: CarloadCotacao[] = [];
  allCotacoes: CarloadCotacao[] = []; // mantém cópia total para filtros combinados
  dataCustomer: CarloadCustomer[] = [];

  cotacaoForm!: FormGroup;
  isDrawerVisible = false;
  currentCotacaoId: string | null = null;
  searchValue = '';

  dateRange: Date[] | null = null;
  selectedCustomerId: string | null = null;

  itemsOptions: string[] = [
    "M4_AREIA_GROSSA", "M4_PEDRA_3_4", "M4_PEDRA_SARRISCA", "M4_PO_DE_PEDRA", "M4_AREIA_FINA",
    "M7_AREIA_GROSSA", "M7_PEDRA_3_4", "M7_PEDRA_SARRISCA", "M7_PO_DE_PEDRA", "M7_AREIA_FINA",
    "M18_AREIA_GROSSA", "M18_PEDRA_3_4", "M18_PEDRA_SARRISCA", "M18_PO_DE_PEDRA", "M18_AREIA_FINA",
    "M20_AREIA_GROSSA", "M20_PEDRA_3_4", "M20_PEDRA_SARRISCA", "M20_PO_DE_PEDRA", "M20_AREIA_FINA",
    "M22_AREIA_GROSSA", "M22_PEDRA_3_4", "M22_PEDRA_SARRISCA", "M22_PO_DE_PEDRA", "M22_AREIA_FINA"
  ];

  itemsPrices: { [key: string]: number } = {
    "M4_AREIA_GROSSA": 5000,
    "M4_PEDRA_3_4": 5500,
    "M4_PEDRA_SARRISCA": 5500,
    "M4_PO_DE_PEDRA": 4500,
    "M4_AREIA_FINA": 4500,
    "M7_AREIA_GROSSA": 7500,
    "M7_PEDRA_3_4": 8000,
    "M7_PEDRA_SARRISCA": 800,
    "M7_PO_DE_PEDRA": 7500,
    "M7_AREIA_FINA": 6500,
    "M18_AREIA_GROSSA": 17000,
    "M18_PEDRA_3_4": 18000,
    "M18_PEDRA_SARRISCA": 18000,
    "M18_PO_DE_PEDRA": 16000,
    "M18_AREIA_FINA": 12000,
    "M20_AREIA_GROSSA": 20000,
    "M20_PEDRA_3_4": 22000,
    "M20_PEDRA_SARRISCA": 22000,
    "M20_PO_DE_PEDRA": 19000,
    "M20_AREIA_FINA": 14000,
    "M22_AREIA_GROSSA": 22000,
    "M22_PEDRA_3_4": 25000,
    "M22_PEDRA_SARRISCA": 25000,
    "M22_PO_DE_PEDRA": 22000,
    "M22_AREIA_FINA": 16000
  };

  // ===================== CONSTRUTOR =====================
  constructor(
    private fb: FormBuilder,
    private cotacaoService: CarloadCotacaoService,
    private customerService: CarloadCustomerService,
    private message: NzMessageService,
    private modal: NzModalService
  ) {
  }

  // ===================== GETTERS =====================
  get items(): FormArray {
    return this.cotacaoForm.get('items') as FormArray;
  }

  // ===================== CICLO DE VIDA =====================
  ngOnInit(): void {
    this.loadCotacoes();
    this.loadCustomers();
    this.initForm();
  }

  // ===================== MANIPULAÇÃO DE ITENS =====================
  addItem() {
    const itemGroup = this.fb.group({
      description: ['', Validators.required],
      quantity: [1, [Validators.required, Validators.min(1)]],
      unitPrice: [0, [Validators.required, Validators.min(0)]],
      amount: [{value: 0, disabled: true}]
    });

    itemGroup.get('quantity')?.valueChanges.subscribe(() => this.updateItemAmount(itemGroup));
    itemGroup.get('unitPrice')?.valueChanges.subscribe(() => this.updateItemAmount(itemGroup));

    this.items.push(itemGroup);
  }

  removeItem(index: number) {
    this.items.removeAt(index);
    this.calculateTotals();
  }

  onItemChange(itemName: string, index: number) {
    const itemGroup = this.items.at(index) as FormGroup;
    const price = this.itemsPrices[itemName] || 0;
    itemGroup.patchValue({unitPrice: price, quantity: 1});
    this.updateItemAmount(itemGroup);
  }

  // ===================== DRAWER =====================
  openDrawer(): void {
    this.isDrawerVisible = true;
    this.currentCotacaoId = null;
    this.cotacaoForm.reset({taxRate: 0.16});
    this.items.clear();
    this.addItem();
  }

  closeDrawer(): void {
    this.isDrawerVisible = false;
    this.cotacaoForm.reset({taxRate: 0.16});
    this.items.clear();
    this.currentCotacaoId = null;
  }

  // ===================== CRUD DE INVOICES =====================
  submitCotacao(): void {
    if (!this.cotacaoForm.valid) return;
    const cotacaoData = this.cotacaoForm.getRawValue();

    if (this.currentCotacaoId) {
      this.cotacaoService.updateCotacao(this.currentCotacaoId, cotacaoData).subscribe({
        next: () => {
          this.loadCotacoes();
          this.closeDrawer();
          this.message.success('Cotacao updated ✅');
        },
        error: () => this.message.error('Error updating cotacao 🚫')
      });
    } else {
      this.cotacaoService.addCotacao(cotacaoData).subscribe({
        next: () => {
          this.loadCotacoes();
          this.closeDrawer();
          this.message.success('Cotacao created ✅');
        },
        error: () => this.message.error('Error creating cotacao 🚫')
      });
    }
  }

  editCotacao(cotacao: CarloadCotacao) {
    this.currentCotacaoId = cotacao.id;
    this.isDrawerVisible = true;

    this.items.clear();
    cotacao.items.forEach(it => {
      const group = this.fb.group({
        description: [it.description, Validators.required],
        quantity: [it.quantity, Validators.required],
        unitPrice: [it.unitPrice, Validators.required],
        amount: [{value: it.quantity * it.unitPrice, disabled: true}]
      });
      group.get('quantity')?.valueChanges.subscribe(() => this.updateItemAmount(group));
      group.get('unitPrice')?.valueChanges.subscribe(() => this.updateItemAmount(group));
      this.items.push(group);
    });

    this.cotacaoForm.patchValue({
      carloadCustomerId: cotacao.carloadCustomerId,
      cotacaoCode: cotacao.cotacaoCode,
      taxRate: cotacao.taxRate
    });

    this.calculateTotals();
  }

  deleteCotacao(cotacao: CarloadCotacao) {
    this.modal.confirm({
      nzTitle: 'Are you sure you want to delete this cotacao?',
      nzContent: `<b>${cotacao.cotacaoCode}</b>`,
      nzOkText: 'Yes',
      nzCancelText: 'No',
      nzOnOk: () => {
        this.cotacaoService.deleteCotacao(cotacao.id).subscribe({
          next: () => {
            this.loadCotacoes();
            this.message.success('Cotacao deleted 🗑️');
          },
          error: () => this.message.error('Error deleting cotacao 🚫')
        });
      }
    });
  }

  // ===================== FILTROS E PESQUISA =====================
  filterByCustomer(): void {
    if (!this.selectedCustomerId) {
      this.cotacoes = this.allCotacoes;
    } else {
      this.cotacoes = this.allCotacoes.filter(inv => inv.carloadCustomerId === this.selectedCustomerId);
    }
    this.filterByDateRange();
    this.search();
  }

  filterByDateRange(): void {
    if (!this.dateRange || this.dateRange.length !== 2) {
      this.cotacoes = this.allCotacoes;
      this.search();
      return;
    }

    const [start, end] = this.dateRange;
    const startDate = new Date(start).setHours(0, 0, 0, 0);
    const endDate = new Date(end).setHours(23, 59, 59, 999);

    this.cotacoes = this.allCotacoes.filter(inv => {
      const createdAt = new Date(inv.createdAt).getTime();
      return createdAt >= startDate && createdAt <= endDate;
    });

    this.search();
  }

  search(): void {
    const val = this.searchValue.toLowerCase();
    if (!val) {
      this.loadCotacoes();
      return;
    }
    this.cotacoes = this.cotacoes.filter(inv =>
      inv.cotacaoCode.toLowerCase().includes(val) ||
      inv.items.some((it: any) => it.description.toLowerCase().includes(val))
    );
  }

  // ===================== DOWNLOAD =====================
  downloadCotacao(cotacao: CarloadCotacao) {
    this.cotacaoService.downloadRecibo(cotacao.id).subscribe((fileBlob: Blob) => {
      const url = window.URL.createObjectURL(fileBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = cotacao.fileName || 'cotacao.xlsx';
      a.click();
      window.URL.revokeObjectURL(url);
    });
  }

  // ===================== INICIALIZAÇÃO =====================
  private initForm() {
    this.cotacaoForm = this.fb.group({
      carloadCustomerId: ['', Validators.required],
      cotacaoCode: ['', Validators.required],
      items: this.fb.array([]),
      taxRate: [0.1, Validators.required],
      subtotal: [{value: 0, disabled: true}],
      tax: [{value: 0, disabled: true}],
      total: [{value: 0, disabled: true}]
    });

    this.cotacaoForm.get('taxRate')?.valueChanges.subscribe(() => this.calculateTotals());
  }

  private loadCotacoes() {
    this.cotacaoService.getCotacoes().subscribe(data => {
      this.cotacoes = data;
      this.allCotacoes = data;
    });
  }

  private loadCustomers() {
    this.customerService.getCustomers().subscribe(data => this.dataCustomer = data);
  }

  private updateItemAmount(itemGroup: FormGroup) {
    const quantity = itemGroup.get('quantity')?.value || 0;
    const unitPrice = itemGroup.get('unitPrice')?.value || 0;
    const amount = quantity * unitPrice;
    itemGroup.patchValue({amount}, {emitEvent: false});
    this.calculateTotals();
  }

  private calculateTotals() {
    const subtotal = this.items.controls.reduce((sum, item) => {
      const amount = item.get('amount')?.value || 0;
      return sum + amount;
    }, 0);
    const taxRate = this.cotacaoForm.get('taxRate')?.value || 0;
    const tax = subtotal * taxRate;
    const total = subtotal + tax;

    this.cotacaoForm.patchValue({subtotal, tax, total}, {emitEvent: false});
  }
}
