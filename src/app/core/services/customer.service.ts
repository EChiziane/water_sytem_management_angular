import {DataAccessService} from '@core/auth/data-access.service';
import {Injectable} from '@angular/core';
import {environment} from '../../../environments/environments';
import {HttpClient} from '@angular/common/http';
import {Observable, take} from 'rxjs';
import {Customer} from '@shared/models/WSM/customer';
import {WaterLocalDataService} from '@core/services/water-local-data.service';

export type CustomerPayload = Partial<Omit<Customer, 'id' | 'code' | 'createdAt' | 'unpaidMonths'>>;

@Injectable({
  providedIn: 'root'
})
export class CustomerService {
  private baseURL = environment.baseURL + '/customers';

  constructor(
    private access: DataAccessService,
    private http: HttpClient,
    private localData: WaterLocalDataService
  ) {
  }

  getCustomers(): Observable<Customer[]> {
    return this.access.run('customers.read', () => this.http.get<Customer[]>(this.baseURL), () => this.localData.getCustomers());
  }

  deleteCustomer(id: string): Observable<Customer> {
    return this.access.denied();
  }

  addCustomer(customer: CustomerPayload): Observable<Customer> {
    return this.access.run('customers.create', () => this.http.post<Customer>(this.baseURL, customer).pipe(take(1)), () => this.localData.addCustomer(customer));
  }

  getCustomerById(id: string): Observable<Customer> {
    return this.access.run('customers.read', () => this.http.get<Customer>(`${this.baseURL}/${id}`), () => this.localData.getCustomerById(id));
  }

  updateCustomer(id: string, customer: CustomerPayload): Observable<Customer> {
    return this.access.run('customers.edit', () => this.http.put<Customer>(`${this.baseURL}/${id}`, customer).pipe(take(1)), () => this.localData.updateCustomer(id, customer));
  }
}
