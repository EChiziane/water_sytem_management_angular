import {Component, OnInit} from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';
import {PaymentService} from '@core/services/payment.service';
import {Payment} from '@shared/models/WSM/payment';
import {PaymentInvoiceService} from '@core/services/payment-invoice.service';
import {MONTH_NAMES_PT} from '@shared/constants/app-labels';
import {finalize} from 'rxjs';

@Component({
  selector: 'app-payment-details',
  standalone: false,
  templateUrl: './payment-details.component.html',
  styleUrls: ['./payment-details.component.scss']
})
export class PaymentDetailsComponent implements OnInit {

  payment!: Payment;

  paymentId!: string;

  isLoading = true;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private paymentService: PaymentService,
    private paymentInvoiceService: PaymentInvoiceService,
  ) {}

  get customerInitials(): string {
    const value = this.payment?.customerName || 'Cliente';
    return value
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map(part => part.charAt(0).toUpperCase())
      .join('') || 'C';
  }

  get statusLabel(): string {
    return this.payment?.confirmed ? 'Confirmado' : 'Nao confirmado';
  }

  get statusColor(): string {
    return this.payment?.confirmed ? 'green' : 'volcano';
  }

  ngOnInit(): void {

    this.route.params.subscribe(params => {

      this.paymentId = params['id'];

      this.getPayment();
    });
  }

  goBack(): void {
    window.history.back();
  }

  goToPayments(): void {
    this.router.navigate(['/app/payment']);
  }

  download(): void {

    this.paymentInvoiceService
      .downloadPaymentInvoice(this.payment);
  }

  formatReferenceMonths(reference: string): string[] {

    if (!reference) return [];

    return reference
      .split('|')
      .map(month =>
        this.formatMonth(month.trim())
      );
  }

  formatMoney(value: number | null | undefined): string {
    return `${Number(value || 0).toFixed(2)} MT`;
  }

  phoneHref(phone: string | null | undefined): string {
    const digits = (phone || '').toString().replace(/[^\d+]/g, '');
    return digits ? `tel:${digits}` : 'tel:';
  }

  private getPayment(): void {

    this.isLoading = true;

    this.paymentService
      .getPaymentById(this.paymentId)
      .pipe(finalize(() => this.isLoading = false))
      .subscribe({

        next: (payment: Payment) => {

          this.payment = {

            ...payment,

            confirmed:
              payment.confirmed,

            numMonths:
              Number(payment.numMonths)
          };
        },

        error: () => {
        }
      });
  }

  private formatMonth(month: string): string {

    const [year, monthNumber] =
      month.split('-');

    return `${MONTH_NAMES_PT[Number(monthNumber) - 1]} ${year}`;
  }
}
