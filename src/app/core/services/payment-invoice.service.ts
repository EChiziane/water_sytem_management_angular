import {Injectable} from '@angular/core';
import {DocumentFilenameService} from '@core/services/document-filename.service';
import {Payment} from '@shared/models/WSM/payment';
import {buildPaymentDocument, PaymentDocumentOptions} from '../utils/payment-document';

@Injectable({providedIn: 'root'})
export class PaymentInvoiceService {
  constructor(private filenames: DocumentFilenameService) {}

  downloadPaymentInvoice(payment: Payment, options: PaymentDocumentOptions = {}): void {
    const kind = options.kind || 'receipt';
    const prefix = kind === 'statement' ? 'DEMONSTRATIVO' : payment.confirmed ? 'RECIBO' : 'REGISTO_PAGAMENTO';
    buildPaymentDocument(payment, options).save(this.filenames.build(prefix, options.reference || payment.referenceCode || payment.id));
  }

  downloadBillingStatement(payment: Payment): void {
    this.downloadPaymentInvoice(payment, {kind: 'statement'});
  }
}