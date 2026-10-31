import {DataAccessService} from '@core/auth/data-access.service';
import {Injectable} from '@angular/core';
import {environment} from '../../../environments/environments';
import {HttpClient} from '@angular/common/http';
import {Observable, take} from 'rxjs';
import {Payment} from '@shared/models/WSM/payment';
import {WaterLocalDataService} from '@core/services/water-local-data.service';

export type PaymentPayload = Partial<Omit<Payment, 'id' | 'referenceCode'>>;

@Injectable({
  providedIn: 'root'
})
export class PaymentService {
  private baseURL = environment.baseURL + '/payments';

  constructor(
    private access: DataAccessService,
    private http: HttpClient,
    private localData: WaterLocalDataService
  ) {
  }

  getPayments(): Observable<Payment[]> {
    return this.access.run('payments.read', () => this.http.get<Payment[]>(this.baseURL), () => this.localData.getPayments());
  }

  getCustomerPayments(id: string): Observable<Payment[]> {
    return this.access.run('payments.read', () => this.http.get<Payment[]>(`${this.baseURL}/customer/${id}`), () => this.localData.getCustomerPayments(id));
  }

  deletePayment(id: string): Observable<Payment> {
    return this.access.denied();
  }

  addPayment(payment: PaymentPayload): Observable<Payment> {
    return this.access.run('payments.create', () => this.http.post<Payment>(this.baseURL, payment).pipe(take(1)), () => this.localData.addPayment(payment));
  }

  getPaymentById(id: string): Observable<Payment> {
    return this.access.run('payments.read', () => this.http.get<Payment>(`${this.baseURL}/${id}`), () => this.localData.getPaymentById(id));
  }

  getPaymentInvoice(id: string): Observable<Payment> {
    return this.access.run('documents.issue', () => this.http.get<Payment>(`${this.baseURL}/${id}`), () => this.localData.getPaymentById(id));
  }

  printInvoice(id: string): Observable<Payment> {
    return this.getPaymentInvoice(id);
  }
}
