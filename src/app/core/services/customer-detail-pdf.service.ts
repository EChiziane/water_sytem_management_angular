import {CompanyProfileService} from './company-profile.service';
import {NzMessageService} from 'ng-zorro-antd/message';
import {TranslationService} from './translation.service';
import {Injectable} from '@angular/core';
import {DocumentFilenameService} from '@core/services/document-filename.service';
import {Customer} from '@shared/models/WSM/customer';
import {Payment} from '@shared/models/WSM/payment';
import {buildCustomerDocument} from '@core/utils/customer-document';

@Injectable({providedIn:'root'})
export class CustomerDetailPdfService {
  constructor(private companyProfiles: CompanyProfileService, private messages: NzMessageService, private translations: TranslationService, private filenames: DocumentFilenameService) {}
  downloadCustomerReport(customer: Customer, payments: Payment[], includeHistory = false): void {
    this.companyProfiles.getIssuerProfile().subscribe({next:company=>buildCustomerDocument(customer,payments,{includeHistory,company}).save(this.filenames.build('CLIENTE',customer.code)),error:()=>this.messages.error(this.translations.instant('company.documentError'))});
  }
}
