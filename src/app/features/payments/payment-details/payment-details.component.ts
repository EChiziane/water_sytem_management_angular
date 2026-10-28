import {Component, OnInit} from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';
import {PaymentService} from '@core/services/payment.service';
import {Payment} from '@shared/models/WSM/payment';
import {PaymentInvoiceService} from '@core/services/payment-invoice.service';
import {finalize} from 'rxjs';
import {money, paymentMethodLabel, referenceMonths, paymentQuantity} from '@shared/utils/payment-presentation';

@Component({
  selector: 'app-payment-details',
  standalone: false,
  templateUrl: './payment-details.component.html',
  styleUrls: ['./payment-details.component.scss']
})
export class PaymentDetailsComponent implements OnInit {

  payment: Payment | null = null;

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
    return this.payment?.confirmed ? 'Confirmado' : 'Aguarda confirmação';
  }

  get methodLabel(): string { return paymentMethodLabel(this.payment?.paymentMethod); }
  get quantity(): number { return this.payment ? paymentQuantity(this.payment) : 0; }
  get periods(): string[] { return referenceMonths(this.payment?.referenceMonth); }
  downloadStatement(): void { if (this.payment) this.paymentInvoiceService.downloadBillingStatement(this.payment); }
  goToCustomer(): void { if (this.payment) this.router.navigate(['/app/customer-detail', this.payment.customerId]); }

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
    if (!this.payment) return;
    this.paymentInvoiceService
      .downloadPaymentInvoice(this.payment);
  }

  formatReferenceMonths(reference: string): string[] {
    return referenceMonths(reference);
  }

  formatMoney(value: number | null | undefined): string {
    return money(value);
  }

  phoneHref(phone: string | null | undefined): string {
    const digits = (phone || '').toString().replace(/[^\d+]/g, '');
    return digits ? `tel:${digits}` : 'tel:';
  }

  private getPayment(): void {

    this.isLoading = true;
    this.payment = null;

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

}
