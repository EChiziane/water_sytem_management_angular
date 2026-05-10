// services/billing.service.ts

import { Injectable } from '@angular/core';

import { HttpClient } from '@angular/common/http';

import { Observable, take } from 'rxjs';

import { environment } from '../../../environments/environments';
import {MonthlyCharge} from '../../models/monthly-charge';


@Injectable({
  providedIn: 'root'
})
export class BillingService {

  private baseURL =
    environment.baseURL + '/billing';

  constructor(
    private http: HttpClient
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
      .pipe(take(1));
  }

  // ==========================================
  // GET ALL BILLING
  // ==========================================

  public getAllBilling():
    Observable<MonthlyCharge[]> {

    return this.http.get<MonthlyCharge[]>(
      this.baseURL
    );
  }

  // ==========================================
  // GET CUSTOMER TIMELINE
  // ==========================================

  public getCustomerTimeline(
    customerId: string
  ): Observable<MonthlyCharge[]> {

    return this.http.get<MonthlyCharge[]>(

      `${this.baseURL}/customer/${customerId}`

    );
  }

  // ==========================================
  // GET CUSTOMER UNPAID MONTHS
  // ==========================================

  public getCustomerUnpaidMonths(
    customerId: string
  ): Observable<MonthlyCharge[]> {

    return this.http.get<MonthlyCharge[]>(

      `${this.baseURL}/customer/${customerId}/unpaid`

    );
  }

  // ==========================================
  // GET SPECIFIC MONTH
  // ==========================================

  public getCustomerMonth(
    customerId: string,
    referenceMonth: string
  ): Observable<MonthlyCharge> {

    return this.http.get<MonthlyCharge>(

      `${this.baseURL}/customer/${customerId}/month/${referenceMonth}`

    );
  }

  // ==========================================
  // GET CUSTOMER DEBT COUNT
  // ==========================================

  public getCustomerDebtCount(
    customerId: string
  ): Observable<number> {

    return this.http.get<number>(

      `${this.baseURL}/customer/${customerId}/debt-count`

    );
  }
}
