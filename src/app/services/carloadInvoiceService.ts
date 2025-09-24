import { Injectable } from "@angular/core";
import {environment} from '../../environments/environments';
import {HttpClient} from '@angular/common/http';
import {CarloadInvoice} from '../models/CSM/carloadInvoice';
import {Observable, take} from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class CarloadInvoiceService {
  private baseURL = `${environment.baseURL}/carload-invoices`;

  constructor(private http: HttpClient) {}

  getInvoices(): Observable<CarloadInvoice[]> {
    return this.http.get<CarloadInvoice[]>(this.baseURL);
  }

  getInvoiceById(id: string): Observable<CarloadInvoice> {
    return this.http.get<CarloadInvoice>(`${this.baseURL}/${id}`);
  }

  addInvoice(invoice: CarloadInvoice): Observable<CarloadInvoice> {
    return this.http.post<CarloadInvoice>(this.baseURL, invoice).pipe(take(1));
  }

  updateInvoice(id: string, invoice: CarloadInvoice): Observable<CarloadInvoice> {
    return this.http.put<CarloadInvoice>(`${this.baseURL}/${id}`, invoice).pipe(take(1));
  }

  deleteInvoice(id: string): Observable<CarloadInvoice> {
    return this.http.delete<CarloadInvoice>(`${this.baseURL}/${id}`);
  }
}
