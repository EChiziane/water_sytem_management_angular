import { Component, OnInit } from '@angular/core';
import { forkJoin } from 'rxjs';

import { CustomerService } from '@core/services/customer.service';
import { PaymentService } from '@core/services/payment.service';
import {MONTH_NAMES_PT} from '@shared/constants/app-labels';
import { Customer } from '@shared/models/WSM/customer';
import { Payment } from '@shared/models/WSM/payment';

type DashboardMetric = {
  label: string;
  value: string;
  hint: string;
  icon: string;
  tone: 'primary' | 'success' | 'warning' | 'neutral';
};

type ChartItem = {
  label: string;
  value: number;
  amount: string;
  width: number;
};

@Component({
  selector: 'app-dashboard',
  standalone: false,
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent implements OnInit {
  isLoading = false;

  customers: Customer[] = [];
  payments: Payment[] = [];

  metrics: DashboardMetric[] = [];
  monthlyPayments: ChartItem[] = [];
  topDebtors: Array<Customer & { debtAmount: number }> = [];
  recentPayments: Payment[] = [];

  totalDebt = 0;
  paidThisMonth = 0;
  customersWithDebt = 0;

  constructor(
    private customerService: CustomerService,
    private paymentService: PaymentService
  ) {
  }

  ngOnInit(): void {
    this.loadDashboard();
  }

  loadDashboard(): void {
    this.isLoading = true;

    forkJoin({
      customers: this.customerService.getCustomers(),
      payments: this.paymentService.getPayments()
    }).subscribe({
      next: ({ customers, payments }) => {
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
    if (!reference) {
      return '-';
    }

    const months = reference
      .split('|')
      .map(month => this.formatMonth(month.trim()))
      .filter(Boolean);

    return months.length ? months.join(', ') : '-';
  }

  private buildDashboard(): void {
    const activeCustomers = this.customers.filter(customer => this.isActiveCustomer(customer)).length;
    this.customersWithDebt = this.customers.filter(customer => Number(customer.monthsInDebt || 0) > 0).length;
    this.totalDebt = this.customers.reduce(
      (total, customer) => total + Number(customer.monthlyFee || 0) * Number(customer.monthsInDebt || 0),
      0
    );
    this.paidThisMonth = this.payments
      .filter(payment => this.isCurrentMonth(payment.paymentDate))
      .reduce((total, payment) => total + Number(payment.amount || 0), 0);

    this.metrics = [
      {
        label: 'Clientes',
        value: String(this.customers.length),
        hint: `${activeCustomers} ativos no sistema`,
        icon: 'team',
        tone: 'primary'
      },
      {
        label: 'Pagamentos do mês',
        value: this.formatMoney(this.paidThisMonth),
        hint: 'Valor recebido no mês atual',
        icon: 'credit-card',
        tone: 'success'
      },
      {
        label: 'Clientes com dívida',
        value: String(this.customersWithDebt),
        hint: 'Precisam de acompanhamento',
        icon: 'clock-circle',
        tone: 'warning'
      },
      {
        label: 'Dívida estimada',
        value: this.formatMoney(this.totalDebt),
        hint: 'Baseada nos meses em atraso',
        icon: 'dashboard',
        tone: 'neutral'
      }
    ];

    this.recentPayments = [...this.payments]
      .sort((current, next) => this.toTime(next.paymentDate) - this.toTime(current.paymentDate))
      .slice(0, 6);

    this.topDebtors = [...this.customers]
      .map(customer => ({
        ...customer,
        debtAmount: Number(customer.monthlyFee || 0) * Number(customer.monthsInDebt || 0)
      }))
      .filter(customer => customer.debtAmount > 0)
      .sort((current, next) => next.debtAmount - current.debtAmount)
      .slice(0, 5);

    this.monthlyPayments = this.buildMonthlyPayments();
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
