import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environments';
import { Observable } from 'rxjs';
import { MonthlyCharge } from '@shared/models/monthly-charge';

@Injectable({
  providedIn: 'root'
})
export class MonthlyChargeService {

  private baseURL = environment.baseURL + "/billing";

  constructor(private http: HttpClient) {}

  getAll(): Observable<MonthlyCharge[]> {
    return this.http.get<MonthlyCharge[]>(this.baseURL);
  }

  generateMonth(): Observable<any> {
    return this.http.post(`${this.baseURL}/generate-month`, {});
  }

  getCustomerUnpaidMonths(customerId: string): Observable<MonthlyCharge[]> {
    return this.http.get<MonthlyCharge[]>(
      `${this.baseURL}/customer/${customerId}/unpaid`
    );
  }
}
