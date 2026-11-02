import { DataAccessService } from '@core/data/data-access.service';
import { Injectable } from '@angular/core';
import { environment } from '../../../../environments/environments';
import { HttpClient } from '@angular/common/http';
import { Observable, take } from 'rxjs';
import { Payment } from '@shared/models/payment';
import { Recibo } from '@shared/models/receipt';
import { WaterLocalDataService } from '@core/data/demo/water-local-data.service';

@Injectable({
  providedIn: 'root',
})
export class CustomerPaymentInvoiceService {
  private baseURL = environment.baseURL + '/customer_payments_invoice';

  constructor(
    private access: DataAccessService,
    private http: HttpClient,
    private localData: WaterLocalDataService,
  ) {}

  createCustomerPaymentInvoice(payment: Payment): Observable<Payment> {
    return this.access.run(
      'documents.issue',
      () => this.http.post<Payment>(`${this.baseURL}/${payment.id}`, payment).pipe(take(1)),
      () => this.localData.getPaymentById(payment.id),
    );
  }

  downloadRecibo(id: string): Observable<Blob> {
    return this.http.get(`${this.baseURL}/download/${id}`, {
      responseType: 'blob',
    });
  }

  getCustomerPaymentInvoice(): Observable<Recibo[]> {
    return this.access.run(
      'documents.issue',
      () => this.http.get<Recibo[]>(this.baseURL),
      () => this.localData.getReceipts(),
    );
  }
}
