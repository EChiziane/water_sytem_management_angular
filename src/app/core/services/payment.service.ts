import {Injectable} from '@angular/core';
import {environment} from '../../../environments/environments';
import {HttpClient} from '@angular/common/http';
import {Observable, catchError, take} from 'rxjs';
import {Payment} from '@shared/models/WSM/payment';
import {WaterLocalDataService} from '@core/services/water-local-data.service';

export type PaymentPayload = Partial<Omit<Payment, 'id' | 'referenceCode'>>;

@Injectable({
  providedIn: 'root'
})
export class PaymentService {
  private baseURL = environment.baseURL + '/payments';

  constructor(
    private http: HttpClient,
    private localData: WaterLocalDataService
  ) {
  }

  getPayments(): Observable<Payment[]> {
    return this.http.get<Payment[]>(this.baseURL).pipe(
      catchError(() => this.localData.getPayments())
    );
  }

  getCustomerPayments(id: string): Observable<Payment[]> {
    return this.http.get<Payment[]>(`${this.baseURL}/customer/${id}`).pipe(
      catchError(() => this.localData.getCustomerPayments(id))
    );
  }

  deletePayment(id: string): Observable<Payment> {
    return this.http.delete<Payment>(`${this.baseURL}/${id}`).pipe(
      catchError(() => this.localData.deletePayment(id))
    );
  }

  addPayment(payment: PaymentPayload): Observable<Payment> {
    return this.http.post<Payment>(this.baseURL, payment).pipe(
      take(1),
      catchError(() => this.localData.addPayment(payment))
    );
  }

  getPaymentById(id: string): Observable<Payment> {
    return this.http.get<Payment>(`${this.baseURL}/${id}`).pipe(
      catchError(() => this.localData.getPaymentById(id))
    );
  }

  getPaymentInvoice(id: string): Observable<Payment> {
    return this.http.get<Payment>(`${this.baseURL}/invoice/${id}`).pipe(
      catchError(() => this.localData.getPaymentById(id))
    );
  }

  printInvoice(id: string): Observable<Payment> {
    return this.getPaymentInvoice(id);
  }
}
