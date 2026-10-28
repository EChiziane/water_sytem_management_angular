// services/billing.service.ts

import { Injectable } from '@angular/core';

import { HttpClient } from '@angular/common/http';

import { Observable, catchError, map, of, take } from 'rxjs';

import { environment } from '../../../environments/environments';
import {MonthlyCharge} from '@shared/models/monthly-charge';
import {WaterLocalDataService} from '@core/services/water-local-data.service';


@Injectable({
  providedIn: 'root'
})
export class BillingService {

  private baseURL =
    environment.baseURL + '/billing';

  constructor(
    private http: HttpClient,
    private localData: WaterLocalDataService
  ) {}

  // ==========================================
  // SYNC ALL TIMELINES
  // ==========================================

  public syncAllTimelines(): Observable<string> {

    return this.http
      .post(
        `${this.baseURL}/sync`,
        {},
        {
          responseType: 'text'
        }
      )
      .pipe(
        take(1),
        catchError(() => this.localData.syncBilling())
      );
  }

  // ==========================================
  // GET ALL BILLING
  // ==========================================

  public getAllBilling():
    Observable<MonthlyCharge[]> {

    return this.http.get<MonthlyCharge[]>(this.baseURL).pipe(
      catchError(() => this.localData.getBilling())
    );
  }

  // ==========================================
  // GET CUSTOMER TIMELINE
  // ==========================================

  public getCustomerTimeline(
    customerId: string
  ): Observable<MonthlyCharge[]> {

    return this.http.get<MonthlyCharge[]>(`${this.baseURL}/customer/${customerId}`).pipe(
      catchError(() => this.localData.getCustomerBilling(customerId))
    );
  }

  // ==========================================
  // GET CUSTOMER UNPAID MONTHS
  // ==========================================

  public getCustomerUnpaidMonths(
    customerId: string
  ): Observable<MonthlyCharge[]> {

    return this.http.get<MonthlyCharge[]>(`${this.baseURL}/customer/${customerId}/unpaid`).pipe(
      catchError(() => this.localData.getCustomerUnpaidMonths(customerId))
    );
  }

  // ==========================================
  // GET SPECIFIC MONTH
  // ==========================================

  public getCustomerMonth(
    customerId: string,
    referenceMonth: string
  ): Observable<MonthlyCharge> {

    return this.http.get<MonthlyCharge>(`${this.baseURL}/customer/${customerId}/month/${referenceMonth}`).pipe(
      catchError(() => this.localData.getCustomerMonth(customerId, referenceMonth))
    );
  }

  // ==========================================
  // GET CUSTOMER DEBT COUNT
  // ==========================================

  public getCustomerDebtCount(
    customerId: string
  ): Observable<number> {

    return this.http.get<number>(`${this.baseURL}/customer/${customerId}/debt-count`).pipe(
      catchError(() => this.localData.getCustomerDebtCount(customerId))
    );
  }
}
