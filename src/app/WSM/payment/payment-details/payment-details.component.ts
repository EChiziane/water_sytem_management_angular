import {Component, OnInit} from '@angular/core';
import {ActivatedRoute} from '@angular/router';
import {PaymentService} from '../../../services/payment.service';
import {Payment} from '../../../models/WSM/payment';
import {PaymentInvoiceService} from '../../../services/payment-invoice.service';
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
    private paymentService: PaymentService,
    private paymentInvoiceService: PaymentInvoiceService,
  ) {}

  ngOnInit(): void {

    this.route.params.subscribe(params => {

      this.paymentId = params['id'];

      this.getPayment();
    });
  }

  goBack(): void {
    window.history.back();
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

    const monthNames = [
      'Janeiro',
      'Fevereiro',
      'Março',
      'Abril',
      'Maio',
      'Junho',
      'Julho',
      'Agosto',
      'Setembro',
      'Outubro',
      'Novembro',
      'Dezembro'
    ];

    return `${
      monthNames[Number(monthNumber) - 1]
    } ${year}`;
  }
}
