import {Injectable} from '@angular/core';
import {environment} from '../../../environments/environments';
import {HttpClient} from '@angular/common/http';
import {Observable, catchError, take} from 'rxjs';
import {Payment} from '@shared/models/WSM/payment';
import {Recibo} from '@shared/models/WSM/Recibo';
import {WaterLocalDataService} from '@core/services/water-local-data.service';

@Injectable({
  providedIn: 'root'
})
export class CustomerPaymentInvoiceService {
  private baseURL = environment.baseURL + '/customer_payments_invoice';

  constructor(
    private http: HttpClient,
    private localData: WaterLocalDataService
  ) {
  }

  createCustomerPaymentInvoice(payment: Payment): Observable<Payment> {
    return this.http.post<Payment>(`${this.baseURL}/${payment.id}`, payment).pipe(
      take(1),
      catchError(() => this.localData.getPaymentById(payment.id))
    );
  }

  downloadRecibo(id: string): Observable<Blob> {
    return this.http.get(`${this.baseURL}/download/${id}`, {
      responseType: 'blob'
    });
  }

  getCustomerPaymentInvoice(): Observable<Recibo[]> {
    return this.http.get<Recibo[]>(this.baseURL).pipe(
      catchError(() => this.localData.getReceipts())
    );
  }
}
