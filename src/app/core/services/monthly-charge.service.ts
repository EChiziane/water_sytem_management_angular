import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environments';
import { Observable, catchError, of } from 'rxjs';
import { MonthlyCharge } from '@shared/models/monthly-charge';
import {WaterLocalDataService} from '@core/services/water-local-data.service';

@Injectable({
  providedIn: 'root'
})
export class MonthlyChargeService {

  private baseURL = environment.baseURL + "/billing";

  constructor(
    private http: HttpClient,
    private localData: WaterLocalDataService
  ) {}

  getAll(): Observable<MonthlyCharge[]> {
    return this.http.get<MonthlyCharge[]>(this.baseURL).pipe(
      catchError(() => this.localData.getBilling())
    );
  }

  generateMonth(): Observable<any> {
    return this.http.post(`${this.baseURL}/generate-month`, {}).pipe(
      catchError(() => of({message: 'Geracao local concluida.'}))
    );
  }

  getCustomerUnpaidMonths(customerId: string): Observable<MonthlyCharge[]> {
    return this.http.get<MonthlyCharge[]>(
      `${this.baseURL}/customer/${customerId}/unpaid`
    ).pipe(
      catchError(() => this.localData.getCustomerUnpaidMonths(customerId))
    );
  }
}
