import {Injectable} from '@angular/core';
import {DocumentFilenameService} from '@core/services/document-filename.service';
import {Customer} from '@shared/models/WSM/customer';
import {Payment} from '@shared/models/WSM/payment';
import {buildCustomerDocument} from '@core/utils/customer-document';

@Injectable({providedIn:'root'})
export class CustomerDetailPdfService {
  constructor(private filenames: DocumentFilenameService) {}
  downloadCustomerReport(customer: Customer, payments: Payment[], includeHistory = false): void {
    buildCustomerDocument(customer,payments,{includeHistory}).save(this.filenames.build('CLIENTE',customer.code));
  }
}
