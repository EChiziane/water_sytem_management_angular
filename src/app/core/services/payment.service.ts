import {Injectable} from '@angular/core';
import {environment} from '../../../environments/environments';
import {HttpClient} from '@angular/common/http';
import {Observable, take} from 'rxjs';
import {Payment} from '@shared/models/WSM/payment';

export type PaymentPayload = Partial<Omit<Payment, 'id' | 'referenceCode'>>;

@Injectable({
  providedIn: 'root'
})
export class PaymentService {
  private baseURL = environment.baseURL + '/payments';

  constructor(private http: HttpClient) {
  }

  getPayments(): Observable<Payment[]> {
    return this.http.get<Payment[]>(this.baseURL);
  }

  getCustomerPayments(id: string): Observable<Payment[]> {
    return this.http.get<Payment[]>(`${this.baseURL}/customer/${id}`);
  }

  deletePayment(id: string): Observable<Payment> {
    return this.http.delete<Payment>(`${this.baseURL}/${id}`);
  }

  addPayment(payment: PaymentPayload): Observable<Payment> {
    return this.http.post<Payment>(this.baseURL, payment).pipe(take(1));
  }

  getPaymentById(id: string): Observable<Payment> {
    return this.http.get<Payment>(`${this.baseURL}/${id}`);
  }

  getPaymentInvoice(id: string): Observable<Payment> {
    return this.http.get<Payment>(`${this.baseURL}/invoice/${id}`);
  }

  printInvoice(id: string): Observable<Payment> {
    return this.getPaymentInvoice(id);
  }
}
