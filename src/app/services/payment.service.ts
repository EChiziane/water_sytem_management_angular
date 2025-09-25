import {Injectable} from '@angular/core';
import {environment} from '../../environments/environments';
import {HttpClient} from '@angular/common/http';
import {Observable, take} from 'rxjs';
import {Payment} from '../models/WSM/payment';
import {Student} from '../models/EISSM/students';

@Injectable({
  providedIn: 'root'
})
export class PaymentService {

  private baseURL = environment.baseURL + "/payments";

  constructor(private http: HttpClient) {
  }

  public getPayments(): Observable<Payment[]> {
    return this.http.get<Payment[]>(this.baseURL);
  }

  public getCustomerPayments(id:string): Observable<Payment[]> {
    return this.http.get<Payment[]>(`${this.baseURL}/customer/${id}`);
  }




  public deletePayment(id: string): Observable<Payment> {
    return this.http.delete<Payment>(`${this.baseURL}/${id}`);
  }

  public addPayment(payment: any): Observable<Payment> {
    return this.http.post<Payment>(this.baseURL, payment).pipe(take(1));
  }

  public getPaymentById(id: string): Observable<Payment> {
    return this.http.get<Payment>(`${this.baseURL}/${id}`);
  }


  public getPaymentInvoice(id: string): Observable<Payment> {
    return this.http.get<Payment>(`${this.baseURL}/invoice/${id}`);
  }


  printInvoice(id: string):Observable<Payment> {
    return this.http.get<Payment>(`${this.baseURL}/invoice/${id}` );
  }

}
