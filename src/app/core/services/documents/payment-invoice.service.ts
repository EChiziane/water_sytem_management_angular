import { CompanyProfileService } from '../company/company-profile.service';
import { NzMessageService } from 'ng-zorro-antd/message';
import { TranslationService } from '../i18n/translation.service';
import { Injectable } from '@angular/core';
import { DocumentFilenameService } from '@core/services/documents/document-filename.service';
import { Payment } from '@shared/models/payment';
import { buildPaymentDocument, PaymentDocumentOptions } from './templates/payment-document';

@Injectable({ providedIn: 'root' })
export class PaymentInvoiceService {
  constructor(
    private companyProfiles: CompanyProfileService,
    private messages: NzMessageService,
    private translations: TranslationService,
    private filenames: DocumentFilenameService,
  ) {}

  downloadPaymentInvoice(payment: Payment, options: PaymentDocumentOptions = {}): void {
    const kind = options.kind || 'receipt';
    const prefix =
      kind === 'statement' ? 'DEMONSTRATIVO' : payment.confirmed ? 'RECIBO' : 'REGISTO_PAGAMENTO';
    this.companyProfiles.getIssuerProfile().subscribe({
      next: (company) =>
        buildPaymentDocument(payment, { ...options, company }).save(
          this.filenames.build(prefix, options.reference || payment.referenceCode || payment.id),
        ),
      error: () => this.messages.error(this.translations.instant('company.documentError')),
    });
  }

  downloadBillingStatement(payment: Payment): void {
    this.downloadPaymentInvoice(payment, { kind: 'statement' });
  }
}
