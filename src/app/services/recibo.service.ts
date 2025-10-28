import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Observable, take} from 'rxjs';
import {environment} from '../../environments/environments';
import {Recibo} from '../models/WSM/Recibo';


@Injectable({
  providedIn: 'root'
})
export class ReciboService {

  baseURL = environment.baseURL + "/receipts";

  constructor(private http: HttpClient) {
  }

  public getRecibos(): Observable<Recibo[]> {
    return this.http.get<Recibo[]>(this.baseURL);
  }

  public getDownloadUrl(id: string): Observable<Recibo> {
    return this.http.get<Recibo>(`${this.baseURL}/download/${id}`);
  }

  downloadRecibo(id: string) {
    return this.http.get(`http://localhost:8080/receipts/download/${id}`, {
      responseType: 'blob' // 👈 Isto diz ao Angular que é um ficheiro, não JSON
    });
  }

  public getRecibosByPayments(id: any): Observable<Recibo[]> {
    return this.http.get<Recibo[]>(`${this.baseURL}/${id}`);
  }


  public getReciboById(id: string): Observable<Recibo> {
    return this.http.get<Recibo>(`${this.baseURL}/${id}`);
  }

  public addRecibo(paymentId: string): Observable<Recibo> {
    const body = {paymentId: paymentId}; // cria o objeto com a chave correta
    console.log(body, "create");
    return this.http.post<Recibo>(`${this.baseURL}`, body).pipe(take(1));
  }


  public deleteRecibo(id: string): Observable<Recibo> {
    return this.http.delete<Recibo>(`${this.baseURL}/${id}`);
  }

  public updateRecibo(id: string, recibo: Recibo): Observable<Recibo> {
    console.log(recibo, "update");
    return this.http.put<Recibo>(`${this.baseURL}/${id}`, recibo).pipe(take(1));
  }
}
