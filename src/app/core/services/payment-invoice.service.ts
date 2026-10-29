import {CompanyProfileService} from './company-profile.service';
import {NzMessageService} from 'ng-zorro-antd/message';
import {TranslationService} from './translation.service';
import {Injectable} from '@angular/core';
import {DocumentFilenameService} from '@core/services/document-filename.service';
import {Payment} from '@shared/models/WSM/payment';
import {buildPaymentDocument, PaymentDocumentOptions} from '../utils/payment-document';

@Injectable({providedIn: 'root'})
export class PaymentInvoiceService {
  constructor(private companyProfiles: CompanyProfileService, private messages: NzMessageService, private translations: TranslationService, private filenames: DocumentFilenameService) {}

  downloadPaymentInvoice(payment: Payment, options: PaymentDocumentOptions = {}): void {
    const kind = options.kind || 'receipt';
    const prefix = kind === 'statement' ? 'DEMONSTRATIVO' : payment.confirmed ? 'RECIBO' : 'REGISTO_PAGAMENTO';
    this.companyProfiles.getProfile().subscribe({next:company=>buildPaymentDocument(payment, {...options,company}).save(this.filenames.build(prefix, options.reference || payment.referenceCode || payment.id)),error:()=>this.messages.error(this.translations.instant('company.documentError'))});
  }

  downloadBillingStatement(payment: Payment): void {
    this.downloadPaymentInvoice(payment, {kind: 'statement'});
  }
}