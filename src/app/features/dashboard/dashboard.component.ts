import {Component, OnInit} from '@angular/core';
import {catchError, finalize, forkJoin, of} from 'rxjs';
import {CustomerService} from '@core/services/customer.service';
import {PaymentService} from '@core/services/payment.service';
import {Customer} from '@shared/models/WSM/customer';
import {Payment} from '@shared/models/WSM/payment';
import {businessTimestamp, maputoMonthKey} from '@shared/utils/business-date';

@Component({
  selector: 'app-dashboard',
  standalone: false,
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent implements OnInit {
  isLoading = false;
  loadFailed = false;
  paymentsFailed = false;
  totalCustomers = 0;
  activeCustomers = 0;
  inactiveCustomers = 0;
  asOf = new Date();
  recentPayments: Payment[] = [];
  debtors: Customer[] = [];

  constructor(private customerService: CustomerService, private paymentService: PaymentService) {}

  ngOnInit(): void { this.loadDashboard(); }

  paymentDate(payment: Payment): number { return businessTimestamp(payment.paymentDate); }

  loadDashboard(): void {
    this.asOf = new Date();
    const currentMonth = maputoMonthKey(this.asOf);
    this.isLoading = true;
    this.loadFailed = false;
    this.paymentsFailed = false;
    this.recentPayments = [];
    this.debtors = [];
    forkJoin({
      customers: this.customerService.getCustomers().pipe(catchError(() => of(null))),
      payments: this.paymentService.getPayments().pipe(catchError(() => of(null)))
    }).pipe(finalize(() => this.isLoading = false)).subscribe(({customers, payments}) => {
      this.loadFailed = customers === null;
      this.paymentsFailed = payments === null;
      if (customers) {
        this.totalCustomers = customers.length;
        this.activeCustomers = customers.filter(customer => ['ATIVO', 'ACTIVE'].includes((customer.status || '').toUpperCase())).length;
        this.inactiveCustomers = customers.filter(customer => ['INATIVO', 'INACTIVE', 'CANCELLED'].includes((customer.status || '').toUpperCase())).length;
        this.debtors = customers.filter(customer => customer.monthsInDebt > 0)
          .sort((a, b) => b.monthsInDebt - a.monthsInDebt || a.name.localeCompare(b.name)).slice(0, 10);
      }
      this.recentPayments = (payments || [])
        .filter(payment => maputoMonthKey(new Date(this.paymentDate(payment))) === currentMonth)
        .sort((a, b) => this.paymentDate(b) - this.paymentDate(a)).slice(0, 10);
    });
  }
}
