import {DataAccessService} from '@core/auth/data-access.service';
import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Observable, take} from 'rxjs';
import {environment} from '../../../environments/environments';
import {Recibo} from '@shared/models/WSM/Recibo';
import {WaterLocalDataService} from '@core/services/water-local-data.service';

@Injectable({
  providedIn: 'root'
})
export class ReciboService {
  private baseURL = environment.baseURL + '/receipts';

  constructor(
    private access: DataAccessService,
    private http: HttpClient,
    private localData: WaterLocalDataService
  ) {
  }

  getRecibos(): Observable<Recibo[]> {
    return this.access.run('documents.issue', () => this.http.get<Recibo[]>(this.baseURL), () => this.localData.getReceipts());
  }

  getDownloadUrl(id: string): Observable<Recibo> {
    return this.access.run('documents.issue', () => this.http.get<Recibo>(`${this.baseURL}/download/${id}`), () => this.localData.getReceiptById(id));
  }

  downloadRecibo(id: string): Observable<Blob> {
    return this.http.get(`${this.baseURL}/download/${id}`, {
      responseType: 'blob'
    });
  }

  getRecibosByPayments(id: string): Observable<Recibo[]> {
    return this.access.run('documents.issue', () => this.http.get<Recibo[]>(`${this.baseURL}/payment/${id}`), () => this.localData.getReceiptsByPayment(id));
  }

  getReciboById(id: string): Observable<Recibo> {
    return this.access.run('documents.issue', () => this.http.get<Recibo>(`${this.baseURL}/${id}`), () => this.localData.getReceiptById(id));
  }

  addRecibo(paymentId: string): Observable<Recibo> {
    return this.access.run('documents.issue', () => this.http.post<Recibo>(this.baseURL, {paymentId}).pipe(take(1)), () => this.localData.addReceipt(paymentId));
  }

  deleteRecibo(id: string): Observable<Recibo> {
    return this.access.denied();
  }

  updateRecibo(id: string, recibo: Recibo): Observable<Recibo> {
    return this.access.denied();
  }
}
