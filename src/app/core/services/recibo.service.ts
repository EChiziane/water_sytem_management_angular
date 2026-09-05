import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Observable, catchError, take} from 'rxjs';
import {environment} from '../../../environments/environments';
import {Recibo} from '@shared/models/WSM/Recibo';
import {WaterLocalDataService} from '@core/services/water-local-data.service';

@Injectable({
  providedIn: 'root'
})
export class ReciboService {
  private baseURL = environment.baseURL + '/receipts';

  constructor(
    private http: HttpClient,
    private localData: WaterLocalDataService
  ) {
  }

  getRecibos(): Observable<Recibo[]> {
    return this.http.get<Recibo[]>(this.baseURL).pipe(
      catchError(() => this.localData.getReceipts())
    );
  }

  getDownloadUrl(id: string): Observable<Recibo> {
    return this.http.get<Recibo>(`${this.baseURL}/download/${id}`).pipe(
      catchError(() => this.localData.getReceiptById(id))
    );
  }

  downloadRecibo(id: string): Observable<Blob> {
    return this.http.get(`${this.baseURL}/download/${id}`, {
      responseType: 'blob'
    });
  }

  getRecibosByPayments(id: string): Observable<Recibo[]> {
    return this.http.get<Recibo[]>(`${this.baseURL}/${id}`).pipe(
      catchError(() => this.localData.getReceiptsByPayment(id))
    );
  }

  getReciboById(id: string): Observable<Recibo> {
    return this.http.get<Recibo>(`${this.baseURL}/${id}`).pipe(
      catchError(() => this.localData.getReceiptById(id))
    );
  }

  addRecibo(paymentId: string): Observable<Recibo> {
    return this.http.post<Recibo>(this.baseURL, {paymentId}).pipe(
      take(1),
      catchError(() => this.localData.addReceipt(paymentId))
    );
  }

  deleteRecibo(id: string): Observable<Recibo> {
    return this.http.delete<Recibo>(`${this.baseURL}/${id}`).pipe(
      catchError(() => this.localData.deleteReceipt(id))
    );
  }

  updateRecibo(id: string, recibo: Recibo): Observable<Recibo> {
    return this.http.put<Recibo>(`${this.baseURL}/${id}`, recibo).pipe(take(1));
  }
}
