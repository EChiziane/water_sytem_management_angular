import {Injectable} from '@angular/core';
import {environment} from '../../environments/environments';
import {HttpClient} from '@angular/common/http';
import {Observable, take} from 'rxjs';
import {Customer} from '../models/WSM/customer';

export type CustomerPayload = Partial<Omit<Customer, 'id' | 'code' | 'createdAt' | 'unpaidMonths'>>;

@Injectable({
  providedIn: 'root'
})
export class CustomerService {
  private baseURL = environment.baseURL + '/customers';

  constructor(private http: HttpClient) {
  }

  getCustomers(): Observable<Customer[]> {
    return this.http.get<Customer[]>(this.baseURL);
  }

  deleteCustomer(id: string): Observable<Customer> {
    return this.http.delete<Customer>(`${this.baseURL}/${id}`);
  }

  addCustomer(customer: CustomerPayload): Observable<Customer> {
    return this.http.post<Customer>(this.baseURL, customer).pipe(take(1));
  }

  getCustomerById(id: string): Observable<Customer> {
    return this.http.get<Customer>(`${this.baseURL}/${id}`);
  }

  updateCustomer(id: string, customer: CustomerPayload): Observable<Customer> {
    return this.http.put<Customer>(`${this.baseURL}/${id}`, customer).pipe(take(1));
  }
}
