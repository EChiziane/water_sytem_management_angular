import {Component, Input, OnInit} from '@angular/core';

import {HttpClient} from '@angular/common/http';
import {ActivatedRoute} from '@angular/router';
import {PaymentService} from '../../../services/payment.service';
import {Payment} from '../../../models/WSM/payment';
import {Customer} from '../../../models/WSM/customer';
import {CustomerService} from '../../../services/customer.service';
import {PaymentInvoiceService} from '../../../services/payment-invoice.service';

/*import jsPDF from 'jspdf';*/

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
    private paymentInvoiceService:PaymentInvoiceService,
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.paymentId = params['id'];
      this.getPayment();
    });
  }

  goBack() {
    window.history.back();
  }

  private getPayment() {
    this.isLoading = true;

    this.paymentService.getPaymentById(this.paymentId).subscribe({
      next: (payment: any) => {
        console.log(payment);
        this.payment = {
          ...payment,
          confirmed: payment.confirmed ?? payment.status,
          numMonths: Number(payment.numMonths)
        };
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
      }
    });
  }

  download() {
    this.paymentInvoiceService.downloadPaymentInvoice(this.payment)
  }
}
