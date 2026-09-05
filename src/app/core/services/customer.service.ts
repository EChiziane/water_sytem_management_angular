import {Injectable} from '@angular/core';
import {environment} from '../../../environments/environments';
import {HttpClient} from '@angular/common/http';
import {Observable, catchError, take} from 'rxjs';
import {Customer} from '@shared/models/WSM/customer';
import {WaterLocalDataService} from '@core/services/water-local-data.service';

export type CustomerPayload = Partial<Omit<Customer, 'id' | 'code' | 'createdAt' | 'unpaidMonths'>>;

@Injectable({
  providedIn: 'root'
})
export class CustomerService {
  private baseURL = environment.baseURL + '/customers';

  constructor(
    private http: HttpClient,
    private localData: WaterLocalDataService
  ) {
  }

  getCustomers(): Observable<Customer[]> {
    return this.http.get<Customer[]>(this.baseURL).pipe(
      catchError(() => this.localData.getCustomers())
    );
  }

  deleteCustomer(id: string): Observable<Customer> {
    return this.http.delete<Customer>(`${this.baseURL}/${id}`).pipe(
      catchError(() => this.localData.deleteCustomer(id))
    );
  }

  addCustomer(customer: CustomerPayload): Observable<Customer> {
    return this.http.post<Customer>(this.baseURL, customer).pipe(
      take(1),
      catchError(() => this.localData.addCustomer(customer))
    );
  }

  getCustomerById(id: string): Observable<Customer> {
    return this.http.get<Customer>(`${this.baseURL}/${id}`).pipe(
      catchError(() => this.localData.getCustomerById(id))
    );
  }

  updateCustomer(id: string, customer: CustomerPayload): Observable<Customer> {
    return this.http.put<Customer>(`${this.baseURL}/${id}`, customer).pipe(
      take(1),
      catchError(() => this.localData.updateCustomer(id, customer))
    );
  }
}
