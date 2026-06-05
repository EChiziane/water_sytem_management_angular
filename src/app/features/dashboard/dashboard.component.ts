import {Component, OnInit} from '@angular/core';
import {Router} from '@angular/router';
import {forkJoin} from 'rxjs';

import {CustomerService} from '@core/services/customer.service';
import {PaymentService} from '@core/services/payment.service';
import {MONTH_NAMES_PT} from '@shared/constants/app-labels';
import {Customer} from '@shared/models/WSM/customer';
import {Payment} from '@shared/models/WSM/payment';

type DashboardMetric = {
  label: string;
  value: string;
  hint: string;
  icon: string;
  tone: 'primary' | 'success' | 'warning' | 'danger' | 'neutral';
};

type ChartItem = {
  label: string;
  value: number;
  amount: string;
  width: number;
};

type FilterMode = 'ALL' | 'DEBT' | 'ACTIVE';
type OperationPanelId = 'debtors' | 'payments' | 'health';

@Component({
  selector: 'app-dashboard',
  standalone: false,
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent implements OnInit {
  private readonly filterStorageKey = 'wsm-dashboard-filters';

  isLoading = false;

  customers: Customer[] = [];
  payments: Payment[] = [];

  metrics: DashboardMetric[] = [];
  monthlyPayments: ChartItem[] = [];
  filteredCustomers: Customer[] = [];
  debtors: Array<Customer & { debtAmount: number }> = [];
  topDebtors: Array<Customer & { debtAmount: number }> = [];
  recentPayments: Payment[] = [];

  searchValue = '';
  filterMode: FilterMode = 'ALL';
  showAllDebtors = false;

  totalDebt = 0;
  paidThisMonth = 0;
  customersWithDebt = 0;
  activeCustomers = 0;
  inactiveCustomers = 0;

  constructor(
    private customerService: CustomerService,
    private paymentService: PaymentService,
    private router: Router
  ) {
  }

  ngOnInit(): void {
    this.restoreFilters();
    this.loadDashboard();
  }

  get operationHeadline(): string {
    if (this.customersWithDebt > 0) {
      return `${this.customersWithDebt} cliente(s) precisam de acompanhamento`;
    }

    if (this.paidThisMonth > 0) {
      return 'Carteira em dia com pagamentos recentes';
    }

    return 'Comece pela organizacao dos clientes e cobrancas';
  }

  get operationSubline(): string {
    const nextDebtor = this.topDebtors[0];

    if (nextDebtor) {
      return `${nextDebtor.name} tem ${nextDebtor.monthsInDebt} mes(es) em atraso, estimado em ${this.formatMoney(nextDebtor.debtAmount)}.`;
    }

    return `${this.activeCustomers} cliente(s) ativos e ${this.formatMoney(this.paidThisMonth)} recebidos neste mes.`;
  }

  get visibleDebtors(): Array<Customer & { debtAmount: number }> {
    return this.showAllDebtors ? this.debtors : this.topDebtors;
  }

  loadDashboard(): void {
    this.isLoading = true;

    forkJoin({
      customers: this.customerService.getCustomers(),
      payments: this.paymentService.getPayments()
    }).subscribe({
      next: ({customers, payments}) => {
        this.customers = customers || [];
        this.payments = payments || [];
        this.buildDashboard();
        this.isLoading = false;
      },
      error: () => {
        this.customers = [];
        this.payments = [];
        this.buildDashboard();
        this.isLoading = false;
      }
    });
  }

  scrollToPanel(panelId: OperationPanelId): void {
    if (typeof document === 'undefined') return;

    document.getElementById(`water-${panelId}`)?.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
      inline: 'nearest'
    });
  }

  filterAll(): void {
    this.filterMode = 'ALL';
    this.applyFilters();
  }

  filterDebt(): void {
    this.filterMode = 'DEBT';
    this.applyFilters();
  }

  filterActive(): void {
    this.filterMode = 'ACTIVE';
    this.applyFilters();
  }

  resetFilters(): void {
    this.searchValue = '';
    this.filterMode = 'ALL';
    this.applyFilters();
  }

  toggleAllDebtors(): void {
    this.showAllDebtors = !this.showAllDebtors;
    this.persistFilters();
  }

  goToCustomers(): void {
    this.router.navigate(['/app/customer']);
  }

  goToPayments(): void {
    this.router.navigate(['/app/payment']);
  }

  goToCustomerDetails(customer: Customer): void {
    this.router.navigate(['/app/customer-detail', customer.id]);
  }

  formatMoney(value: number): string {
    return `${Number(value || 0).toFixed(2)} MT`;
  }

  formatDate(value: string | number | Date | null | undefined): string {
    if (!value) {
      return '-';
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return '-';
    }

    return `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()}`;
  }

  formatReferenceMonths(reference: string | null | undefined): string {
    const months = this.getReferenceMonths(reference);
    return months.length ? months.join(', ') : '-';
  }

  getReferenceMonths(reference: string | null | undefined): string[] {
    if (!reference) {
      return [];
    }

    return reference
      .split('|')
      .map(month => this.formatMonth(month.trim()))
      .filter(Boolean);
  }

  trackById(_: number, item: Customer | Payment): string {
    return item.id;
  }

  debtTone(customer: Customer): string {
    const months = Number(customer.monthsInDebt || 0);

    if (months >= 3) return 'priority-danger';
    if (months === 2) return 'priority-warning';
    return 'priority-watch';
  }

  private buildDashboard(): void {
    this.activeCustomers = this.customers.filter(customer => this.isActiveCustomer(customer)).length;
    this.inactiveCustomers = Math.max(this.customers.length - this.activeCustomers, 0);

    this.debtors = [...this.customers]
      .map(customer => ({
        ...customer,
        debtAmount: Number(customer.monthlyFee || 0) * Number(customer.monthsInDebt || 0)
      }))
      .filter(customer => customer.debtAmount > 0)
      .sort((current, next) => next.debtAmount - current.debtAmount);

    this.customersWithDebt = this.debtors.length;
    this.totalDebt = this.debtors.reduce((total, customer) => total + customer.debtAmount, 0);
    this.paidThisMonth = this.payments
      .filter(payment => this.isCurrentMonth(payment.paymentDate))
      .reduce((total, payment) => total + Number(payment.amount || 0), 0);

    this.metrics = [
      {
        label: 'Clientes ativos',
        value: String(this.activeCustomers),
        hint: `${this.customers.length} cliente(s) registados`,
        icon: 'team',
        tone: 'primary'
      },
      {
        label: 'Pagamentos do mes',
        value: this.formatMoney(this.paidThisMonth),
        hint: 'Valor recebido no mes atual',
        icon: 'credit-card',
        tone: 'success'
      },
      {
        label: 'Clientes com divida',
        value: String(this.customersWithDebt),
        hint: 'Prioridade de cobranca',
        icon: 'clock-circle',
        tone: this.customersWithDebt ? 'warning' : 'neutral'
      },
      {
        label: 'Divida estimada',
        value: this.formatMoney(this.totalDebt),
        hint: 'Baseada nos meses em atraso',
        icon: 'dashboard',
        tone: this.totalDebt > 0 ? 'danger' : 'neutral'
      }
    ];

    this.recentPayments = [...this.payments]
      .sort((current, next) => this.toTime(next.paymentDate) - this.toTime(current.paymentDate))
      .slice(0, 8);

    this.topDebtors = this.debtors.slice(0, 6);
    this.monthlyPayments = this.buildMonthlyPayments();
    this.applyFilters();
  }

  applyFilters(): void {
    let filtered = [...this.customers];

    if (this.searchValue.trim()) {
      const search = this.searchValue.toLowerCase();
      filtered = filtered.filter(customer =>
        (customer.name || '').toLowerCase().includes(search) ||
        (customer.code || '').toLowerCase().includes(search) ||
        (customer.contact || '').toLowerCase().includes(search) ||
        (customer.address || '').toLowerCase().includes(search)
      );
    }

    if (this.filterMode === 'DEBT') {
      filtered = filtered.filter(customer => Number(customer.monthsInDebt || 0) > 0);
    }

    if (this.filterMode === 'ACTIVE') {
      filtered = filtered.filter(customer => this.isActiveCustomer(customer));
    }

    this.filteredCustomers = filtered;
    this.persistFilters();
  }

  private buildMonthlyPayments(): ChartItem[] {
    const totals = new Map<string, number>();

    this.payments.forEach(payment => {
      const date = new Date(payment.paymentDate);

      if (Number.isNaN(date.getTime())) {
        return;
      }

      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      totals.set(key, (totals.get(key) || 0) + Number(payment.amount || 0));
    });

    const items = Array.from(totals.entries())
      .sort(([current], [next]) => current.localeCompare(next))
      .slice(-6)
      .map(([month, value]) => ({
        label: this.formatMonth(month),
        value,
        amount: this.formatMoney(value),
        width: 0
      }));

    const max = Math.max(...items.map(item => item.value), 1);

    return items.map(item => ({
      ...item,
      width: Math.max(8, Math.round((item.value / max) * 100))
    }));
  }

  private restoreFilters(): void {
    if (typeof localStorage === 'undefined') return;

    try {
      const raw = localStorage.getItem(this.filterStorageKey);
      if (!raw) return;

      const saved = JSON.parse(raw) as Partial<{
        searchValue: string;
        filterMode: FilterMode;
        showAllDebtors: boolean;
      }>;

      this.searchValue = saved.searchValue || '';
      this.filterMode = saved.filterMode || 'ALL';
      this.showAllDebtors = !!saved.showAllDebtors;
    } catch {
      localStorage.removeItem(this.filterStorageKey);
    }
  }

  private persistFilters(): void {
    if (typeof localStorage === 'undefined') return;

    localStorage.setItem(this.filterStorageKey, JSON.stringify({
      searchValue: this.searchValue,
      filterMode: this.filterMode,
      showAllDebtors: this.showAllDebtors
    }));
  }

  private isActiveCustomer(customer: Customer): boolean {
    return (customer.status || '').toLowerCase() === 'active' ||
      (customer.status || '').toLowerCase() === 'ativo';
  }

  private isCurrentMonth(value: string | number | Date | null | undefined): boolean {
    if (!value) {
      return false;
    }

    const date = new Date(value);
    const today = new Date();

    return !Number.isNaN(date.getTime()) &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear();
  }

  private toTime(value: string | number | Date | null | undefined): number {
    if (!value) {
      return 0;
    }

    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? 0 : date.getTime();
  }

  private formatMonth(month: string): string {
    if (!month) {
      return '';
    }

    const [year, monthNumber] = month.includes('-')
      ? month.split('-')
      : ['', month];

    const monthName = MONTH_NAMES_PT[Number(monthNumber) - 1];

    if (!monthName) {
      return month;
    }

    return year ? `${monthName} ${year}` : monthName;
  }
}
