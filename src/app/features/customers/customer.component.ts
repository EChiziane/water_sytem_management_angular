import {money} from '@shared/utils/payment-presentation';
import {TranslationService} from '@core/services/translation.service';
import {describeStatus} from '@shared/utils/status-presentation';
import {PermissionService} from '@core/auth/permission.service';
import {OperationConfirmationService} from '@core/services/operation-confirmation.service';
import {tap} from 'rxjs';
import {Component, HostListener, OnInit} from '@angular/core';
import {FormControl, FormGroup, Validators} from '@angular/forms';
import {finalize} from 'rxjs';
import {Customer} from '@shared/models/WSM/customer';
import {CustomerPayload, CustomerService} from '@core/services/customer.service';
import {NzMessageService} from 'ng-zorro-antd/message';
import {NzModalService} from 'ng-zorro-antd/modal';
import {WaterReportPdfService} from '@core/services/water-report-pdf.service';

@Component({
  selector: 'app-customer',
  standalone: false,
  templateUrl: './customer.component.html',
  styleUrls: ['./customer.component.scss']
})
export class CustomerComponent implements OnInit {
  private readonly filterStorageKey = 'wsm-customer-filters';

  dataSource: Customer[] = [];
  listOfDisplayData: Customer[] = [];

  isSaving = false;
  isLoading = false;

  searchValue = '';
  visible = false;
  isCustomerDrawerVisible = false;

  debtFilter: 'ALL' | 'DEBT' | 'CLEAR' = 'ALL';

  totalCustomers = 0;
  activeCustomers = 0;
  customersWithDebt = 0;

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

  constructor(private translations: TranslationService, public permissions: PermissionService,
    private confirmations: OperationConfirmationService,
    private customerService: CustomerService,
    private reports: WaterReportPdfService,
    private message: NzMessageService,
    private modal: NzModalService
  ) {
  }

  ngOnInit(): void {
    for(const name of ['status','valve'] as const)if(!this.permissions.can('customers.lifecycle'))this.customerForm.controls[name].disable();
    if(!this.permissions.can('tariffs.manage'))this.customerForm.controls.monthlyFee.disable();
    this.customerForm.controls.monthsInDebt.disable();
    this.restoreFilters();
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
      this.drawerPlacement = 'right';
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
          this.calculateStats();
          this.applyFilters();
        },
        error: () => this.message.error('Erro ao carregar clientes.')
      });
  }

  get hasActiveFilters(): boolean {
    return this.debtFilter !== 'ALL' || !!this.searchValue.trim();
  }

  get drawerInitials(): string {
    const name = this.customerForm.get('name')?.value || 'Cliente';
    return name
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map(part => part.charAt(0).toUpperCase())
      .join('') || 'C';
  }

  get drawerEstimatedDebt(): number {
    return Number(this.customerForm.get('monthlyFee')?.value || 0) *
      Number(this.customerForm.get('monthsInDebt')?.value || 0);
  }

  applyFilters(): void {
    let data = [...this.dataSource];

    if (this.searchValue) {
      const search = this.searchValue.toLowerCase();
      data = data.filter(item =>
        (item.name || '').toLowerCase().includes(search) ||
        (item.code || '').toLowerCase().includes(search) ||
        (item.contact || '').toLowerCase().includes(search) ||
        (item.address || '').toLowerCase().includes(search)
      );
    }

    if (this.debtFilter === 'DEBT') {
      data = data.filter(item => item.monthsInDebt > 0);
    }

    if (this.debtFilter === 'CLEAR') {
      data = data.filter(item => item.monthsInDebt === 0);
    }

    this.listOfDisplayData = data;
    this.persistFilters();
  }

  search(): void {
    this.visible = false;
    this.applyFilters();
  }

  filterByDebt(value: 'ALL' | 'DEBT' | 'CLEAR'): void {
    this.debtFilter = value;
    this.applyFilters();
  }

  debtAmount(customer: Customer): number {
    return Number(customer.monthlyFee || 0) * Number(customer.monthsInDebt || 0);
  }

  formatMoney(value: number | null | undefined): string {
    return money(value);
  }

  phoneHref(phone: string | null | undefined): string {
    const digits = (phone || '').toString().replace(/[^\d+]/g, '');
    return digits ? `tel:${digits}` : 'tel:';
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

    if (this.isSaving) return;
    const value = this.customerForm.getRawValue();
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

    const id = this.selectedCustomerId;
    const editing = this.isEditMode;
    this.confirmations.run({key:'save-customer:' + (id || 'new'), title:this.confirmations.text('saveCustomerTitle'), description:this.confirmations.text('saveCustomerDescription'),
      fields:[[this.confirmations.text('customer'),formData.name || ''],[this.confirmations.text('status'),this.translations.instant(describeStatus('customer',formData.status).label)],[this.confirmations.text('tariff'),String(formData.monthlyFee) + ' MT']],
      confirmLabel:this.confirmations.text('save')}, () => {
      this.isSaving = true;
      const request$ = editing && id ? this.customerService.updateCustomer(id,formData) : this.customerService.addCustomer(formData);
      return request$.pipe(finalize(() => this.isSaving = false), tap({
        next: () => { this.getCustomers(); this.closeCustomerDrawer(); this.message.success(editing ? 'Cliente atualizado com sucesso.' : 'Cliente criado com sucesso.'); },
        error: () => this.message.error('Erro ao gravar cliente.')
      }));
    });
  }

  deleteCustomer(data: Customer): void {
    this.confirmations.deletion('customer', data.id, [data.code, data.name].filter(Boolean).join(' · '), 'deleteCustomerNote',
      () => this.customerService.deleteCustomer(data.id).pipe(tap({
        next: () => { this.getCustomers(); this.message.success('Cliente eliminado com sucesso.'); },
        error: () => this.message.error('Erro ao eliminar cliente.')
      })));
  }

  viewCustomer(_data: Customer): void {
  }

  reset(): void {
    this.searchValue = '';
    this.debtFilter = 'ALL';
    this.search();
  }

  openCustomerDrawer(): void {
    this.isEditMode = false;
    this.customerDrawerTitle = 'Criar Cliente';
    this.selectedCustomerId = null;
    this.customerForm.reset({
      status: 'ATIVO',
      valve: 10,
      monthlyFee: 750,
      monthsInDebt: 1
    });
    this.isCustomerDrawerVisible = true;
  }

  downloadCustomerList(): void {
    if(!this.permissions.can('reports.financial'))return;
    this.reports.downloadCustomerList(this.listOfDisplayData);
  }

  closeCustomerDrawer(): void {
    this.isCustomerDrawerVisible = false;
    this.customerForm.reset();
    this.selectedCustomerId = null;
    this.isEditMode = false;
  }

  onBack(): void {
    window.history.back();
  }

  private calculateStats(): void {
    this.totalCustomers = this.dataSource.length;
    this.activeCustomers = this.dataSource.filter(customer => this.isActiveCustomer(customer)).length;
    this.customersWithDebt = this.dataSource.filter(customer => Number(customer.monthsInDebt || 0) > 0).length;
  }

  private isActiveCustomer(customer: Customer): boolean {
    return (customer.status || '').toLowerCase() === 'active' ||
      (customer.status || '').toLowerCase() === 'ativo' ||
      (customer.status || '').toUpperCase() === 'ATIVO';
  }

  private restoreFilters(): void {
    if (typeof localStorage === 'undefined') return;

    try {
      const raw = localStorage.getItem(this.filterStorageKey);
      if (!raw) return;

      const saved = JSON.parse(raw) as Partial<{ searchValue: string; debtFilter: 'ALL' | 'DEBT' | 'CLEAR' }>;
      this.searchValue = saved.searchValue || '';
      this.debtFilter = saved.debtFilter || 'ALL';
    } catch {
      localStorage.removeItem(this.filterStorageKey);
    }
  }

  private persistFilters(): void {
    if (typeof localStorage === 'undefined') return;

    localStorage.setItem(this.filterStorageKey, JSON.stringify({
      searchValue: this.searchValue,
      debtFilter: this.debtFilter
    }));
  }
}
