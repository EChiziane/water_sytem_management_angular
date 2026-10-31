import {DataAccessService} from '@core/auth/data-access.service';
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environments';
import { Observable, of } from 'rxjs';
import { MonthlyCharge } from '@shared/models/monthly-charge';
import {WaterLocalDataService} from '@core/services/water-local-data.service';

@Injectable({
  providedIn: 'root'
})
export class MonthlyChargeService {

  private baseURL = environment.baseURL + "/billing";

  constructor(
    private access: DataAccessService,
    private http: HttpClient,
    private localData: WaterLocalDataService
  ) {}

  getAll(): Observable<MonthlyCharge[]> {
    return this.access.run('reports.financial', () => this.http.get<MonthlyCharge[]>(this.baseURL), () => this.localData.getBilling());
  }

  generateMonth(): Observable<any> {
    return this.access.run('billing.generate', () => this.http.post(`${this.baseURL}/sync`, {}, {responseType:'text'}), () => this.localData.syncBilling());
  }

  getCustomerUnpaidMonths(customerId: string): Observable<MonthlyCharge[]> {
    return this.access.run('customers.read', () => this.http.get<MonthlyCharge[]>(
      `${this.baseURL}/customer/${customerId}/unpaid`
    ), () => this.localData.getCustomerUnpaidMonths(customerId));
  }
}
