import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Observable, take} from 'rxjs';
import {environment} from '../../../environments/environments';
import {Recibo} from '../../models/WSM/Recibo';

@Injectable({
  providedIn: 'root'
})
export class ReciboService {
  private baseURL = environment.baseURL + '/receipts';

  constructor(private http: HttpClient) {
  }

  getRecibos(): Observable<Recibo[]> {
    return this.http.get<Recibo[]>(this.baseURL);
  }

  getDownloadUrl(id: string): Observable<Recibo> {
    return this.http.get<Recibo>(`${this.baseURL}/download/${id}`);
  }

  downloadRecibo(id: string): Observable<Blob> {
    return this.http.get(`${this.baseURL}/download/${id}`, {
      responseType: 'blob'
    });
  }

  getRecibosByPayments(id: string): Observable<Recibo[]> {
    return this.http.get<Recibo[]>(`${this.baseURL}/${id}`);
  }

  getReciboById(id: string): Observable<Recibo> {
    return this.http.get<Recibo>(`${this.baseURL}/${id}`);
  }

  addRecibo(paymentId: string): Observable<Recibo> {
    return this.http.post<Recibo>(this.baseURL, {paymentId}).pipe(take(1));
  }

  deleteRecibo(id: string): Observable<Recibo> {
    return this.http.delete<Recibo>(`${this.baseURL}/${id}`);
  }

  updateRecibo(id: string, recibo: Recibo): Observable<Recibo> {
    return this.http.put<Recibo>(`${this.baseURL}/${id}`, recibo).pipe(take(1));
  }
}
