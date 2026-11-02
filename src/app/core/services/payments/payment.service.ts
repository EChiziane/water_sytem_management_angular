import { AuthSessionService } from '@core/auth/auth-session.service';
import { DataAccessService } from '@core/data/data-access.service';
import { Injectable } from '@angular/core';
import { environment } from '../../../../environments/environments';
import { HttpClient } from '@angular/common/http';
import { Observable, take, tap } from 'rxjs';
import { Payment } from '@shared/models/payment';
import { WaterLocalDataService } from '@core/data/demo/water-local-data.service';

export type PaymentPayload = Partial<Omit<Payment, 'id' | 'referenceCode'>>;

@Injectable({
  providedIn: 'root',
})
export class PaymentService {
  private baseURL = environment.baseURL + '/payments';

  constructor(
    private session: AuthSessionService,
    private access: DataAccessService,
    private http: HttpClient,
    private localData: WaterLocalDataService,
  ) {}

  getPayments(): Observable<Payment[]> {
    return this.access.run(
      'payments.read',
      () => this.http.get<Payment[]>(this.baseURL),
      () => this.localData.getPayments(),
    );
  }

  getCustomerPayments(id: string): Observable<Payment[]> {
    return this.access.run(
      'payments.read',
      () => this.http.get<Payment[]>(`${this.baseURL}/customer/${id}`),
      () => this.localData.getCustomerPayments(id),
    );
  }

  deletePayment(id: string): Observable<Payment> {
    return this.access.denied();
  }

  addPayment(payment: PaymentPayload): Observable<Payment> {
    return this.access.run(
      'payments.create',
      () => this.submitPayment(payment),
      () => this.localData.addPayment(payment),
    );
  }

  private submitPayment(payment: PaymentPayload): Observable<Payment> {
    const storageKey = environment.waterStorageKey + '-pending-payments';
    const fingerprint = JSON.stringify([
      this.session.getUser()?.id,
      payment.customerId,
      payment.numMonths,
      payment.amount,
      payment.paymentMethod,
    ]);
    const pending = JSON.parse(localStorage.getItem(storageKey) || '{}');
    const intent = pending[fingerprint] || { key: crypto.randomUUID(), body: payment };
    pending[fingerprint] = intent;
    localStorage.setItem(storageKey, JSON.stringify(pending));
    const clear = () => {
      const current = JSON.parse(localStorage.getItem(storageKey) || '{}');
      delete current[fingerprint];
      localStorage.setItem(storageKey, JSON.stringify(current));
    };
    return this.http
      .post<Payment>(this.baseURL, intent.body, { headers: { 'Idempotency-Key': intent.key } })
      .pipe(
        take(1),
        tap({
          next: clear,
          error: (error) => {
            if ([400, 404, 422].includes(error.status)) clear();
          },
        }),
      );
  }

  getPaymentById(id: string): Observable<Payment> {
    return this.access.run(
      'payments.read',
      () => this.http.get<Payment>(`${this.baseURL}/${id}`),
      () => this.localData.getPaymentById(id),
    );
  }

  getPaymentInvoice(id: string): Observable<Payment> {
    return this.access.run(
      'documents.issue',
      () => this.http.get<Payment>(`${this.baseURL}/${id}`),
      () => this.localData.getPaymentById(id),
    );
  }

  printInvoice(id: string): Observable<Payment> {
    return this.getPaymentInvoice(id);
  }
}
