import {HttpClient} from '@angular/common/http';
import {Injectable} from '@angular/core';
import {BehaviorSubject, Observable, catchError, map, of, tap} from 'rxjs';

import {environment} from '../../../environments/environments';
import {MonthlyCharge} from '@shared/models/monthly-charge';
import {Customer} from '@shared/models/WSM/customer';
import {CustomerPayload} from '@core/services/customer.service';
import {Payment} from '@shared/models/WSM/payment';
import {PaymentPayload} from '@core/services/payment.service';
import {Recibo} from '@shared/models/WSM/Recibo';
import {User} from '@shared/models/user';
import {isOverdueMonth, recoverLocalBilling} from '@shared/utils/billing-recovery';

interface WaterState {
  customers: Customer[];
  payments: Payment[];
  receipts: Recibo[];
  users: User[];
}

interface WaterSourceState extends WaterState {
  version: string;
}

interface WaterStorageEnvelope {
  sourceVersion: string;
  state: WaterState;
}

type UserPayload = Partial<Pick<User, 'name' | 'email' | 'phone' | 'login' | 'password' | 'role' | 'status'>>;

@Injectable({
  providedIn: 'root'
})
export class WaterLocalDataService {
  readonly isLocalMode$ = new BehaviorSubject(false);
  private readonly storageKey = environment.waterStorageKey;
  private readonly dataSourcePath = environment.waterDataSourcePath;
  private sourceState: WaterSourceState | null = null;

  constructor(private http: HttpClient) {
  }

  getCustomers(): Observable<Customer[]> {
    return this.state$().pipe(map(state => this.clone(state.customers)));
  }

  getCustomerById(id: string): Observable<Customer> {
    return this.state$().pipe(
      map(state => {
        const customer = state.customers.find(item => item.id === id);
        if (!customer) throw new Error('Customer not found');
        return this.clone(customer);
      })
    );
  }

  addCustomer(payload: CustomerPayload): Observable<Customer> {
    return this.state$().pipe(
      map(state => {
        const created: Customer = {
          id: this.id('customer'),
          code: this.nextCustomerCode(state.customers),
          name: payload.name || '',
          contact: payload.contact || '',
          address: payload.address || '',
          status: payload.status || 'ATIVO',
          valve: Number(payload.valve || 0),
          monthlyFee: Number(payload.monthlyFee || 0),
          monthsInDebt: Number(payload.monthsInDebt || 0),
          unpaidMonths: this.ensureUnpaidMonths([], Number(payload.monthsInDebt || 0)),
          createdAt: new Date().toISOString()
        };

        state.customers.unshift(created);
        this.save(state);
        return this.clone(created);
      })
    );
  }

  updateCustomer(id: string, payload: CustomerPayload): Observable<Customer> {
    return this.state$().pipe(
      map(state => {
        const index = state.customers.findIndex(item => item.id === id);
        if (index < 0) throw new Error('Customer not found');

        const current = state.customers[index];
        const monthsInDebt = Number(payload.monthsInDebt ?? current.monthsInDebt ?? 0);
        const updated: Customer = {
          ...current,
          ...payload,
          id,
          code: current.code,
          createdAt: current.createdAt,
          valve: Number(payload.valve ?? current.valve ?? 0),
          monthlyFee: Number(payload.monthlyFee ?? current.monthlyFee ?? 0),
          monthsInDebt,
          unpaidMonths: this.ensureUnpaidMonths(current.unpaidMonths || [], monthsInDebt)
        };

        state.customers[index] = updated;
        this.syncPaymentCustomerSnapshots(state, updated);
        this.save(state);
        return this.clone(updated);
      })
    );
  }

  deleteCustomer(id: string): Observable<Customer> {
    return this.state$().pipe(
      map(state => {
        const customer = state.customers.find(item => item.id === id);
        if (!customer) throw new Error('Customer not found');

        const paymentIds = new Set(state.payments.filter(payment => payment.customerId === id).map(payment => payment.id));
        state.customers = state.customers.filter(item => item.id !== id);
        state.payments = state.payments.filter(payment => payment.customerId !== id);
        state.receipts = state.receipts.filter(receipt => !paymentIds.has(receipt.paymentId));
        this.save(state);
        return this.clone(customer);
      })
    );
  }

  getPayments(): Observable<Payment[]> {
    return this.state$().pipe(map(state => this.clone(state.payments)));
  }

  getCustomerPayments(customerId: string): Observable<Payment[]> {
    return this.state$().pipe(
      map(state => this.clone(state.payments.filter(payment => payment.customerId === customerId)))
    );
  }

  getPaymentById(id: string): Observable<Payment> {
    return this.state$().pipe(
      map(state => {
        const payment = state.payments.find(item => item.id === id);
        if (!payment) throw new Error('Payment not found');
        return this.clone(payment);
      })
    );
  }

  addPayment(payload: PaymentPayload): Observable<Payment> {
    return this.state$().pipe(
      map(state => {
        const customer = state.customers.find(item => item.id === payload.customerId);
        if (!customer) throw new Error('Customer not found');

        const numMonths = Math.max(Number(payload.numMonths || 1), 1);
        const months = this.ensureUnpaidMonths(customer.unpaidMonths || [], Math.max(customer.monthsInDebt || 0, numMonths)).slice(0, numMonths);
        const amount = Number(payload.amount || customer.monthlyFee * numMonths || 0);
        const referenceCode = this.nextReceiptCode(state.payments.length + 1);
        const payment: Payment = {
          id: this.id('payment'),
          referenceCode,
          customerId: customer.id,
          customerName: customer.name,
          customerContact: customer.contact,
          customerAddress: customer.address,
          customerValve: customer.valve,
          monthlyFee: customer.monthlyFee,
          amount,
          tax: Number(payload.tax || 0),
          unitPrice: Number(payload.unitPrice || customer.monthlyFee || 0),
          confirmed: payload.confirmed ?? true,
          referenceMonth: months.join('|') || this.currentMonthKey(),
          numMonths,
          paymentDate: payload.paymentDate || new Date().toISOString(),
          paymentMethod: payload.paymentMethod || 'CASH',
          createdBy: payload.createdBy || 'local-user',
          createdByName: payload.createdByName || 'Sistema Local'
        };

        customer.unpaidMonths = (customer.unpaidMonths || []).filter(month => !months.includes(month));
        customer.monthsInDebt = customer.unpaidMonths.length;
        state.payments.unshift(payment);
        state.receipts.unshift(this.receiptFromPayment(payment));
        this.save(state);
        return this.clone(payment);
      })
    );
  }

  deletePayment(id: string): Observable<Payment> {
    return this.state$().pipe(
      map(state => {
        const payment = state.payments.find(item => item.id === id);
        if (!payment) throw new Error('Payment not found');

        state.payments = state.payments.filter(item => item.id !== id);
        state.receipts = state.receipts.filter(receipt => receipt.paymentId !== id);
        this.save(state);
        return this.clone(payment);
      })
    );
  }

  getReceipts(): Observable<Recibo[]> {
    return this.state$().pipe(map(state => this.clone(this.hydrateReceipts(state))));
  }

  getReceiptsByPayment(paymentId: string): Observable<Recibo[]> {
    return this.state$().pipe(
      map(state => this.clone(this.hydrateReceipts(state).filter(receipt => receipt.paymentId === paymentId)))
    );
  }

  getReceiptById(id: string): Observable<Recibo> {
    return this.state$().pipe(
      map(state => {
        const receipt = this.hydrateReceipts(state).find(item => item.id === id);
        if (!receipt) throw new Error('Receipt not found');
        return this.clone(receipt);
      })
    );
  }

  addReceipt(paymentId: string): Observable<Recibo> {
    return this.state$().pipe(
      map(state => {
        const payment = state.payments.find(item => item.id === paymentId);
        if (!payment) throw new Error('Payment not found');

        const existing = state.receipts.find(item => item.paymentId === paymentId);
        if (existing) return this.clone({...existing, payment});

        const receipt = this.receiptFromPayment(payment);
        state.receipts.unshift(receipt);
        this.save(state);
        return this.clone(receipt);
      })
    );
  }

  deleteReceipt(id: string): Observable<Recibo> {
    return this.state$().pipe(
      map(state => {
        const receipt = this.hydrateReceipts(state).find(item => item.id === id);
        if (!receipt) throw new Error('Receipt not found');
        state.receipts = state.receipts.filter(item => item.id !== id);
        this.save(state);
        return this.clone(receipt);
      })
    );
  }

  getUsers(): Observable<User[]> {
    return this.state$().pipe(map(state => this.clone(state.users)));
  }

  getUserById(id: string): Observable<User | undefined> {
    return this.state$().pipe(map(state => this.clone(state.users.find(user => user.id === id))));
  }

  addUser(payload: UserPayload): Observable<User> {
    return this.state$().pipe(
      map(state => {
        const created: User = {
          id: this.id('user'),
          name: payload.name || '',
          email: payload.email || '',
          phone: payload.phone || '',
          login: payload.login || payload.email || '',
          password: payload.password || '123456',
          role: payload.role || 'OPERATOR',
          status: payload.status || 'ACTIVE',
          createdAt: new Date().toISOString()
        };

        state.users.unshift(created);
        this.save(state);
        return this.clone(created);
      })
    );
  }

  updateUser(id: string, payload: UserPayload): Observable<User> {
    return this.state$().pipe(
      map(state => {
        const index = state.users.findIndex(user => user.id === id);
        if (index < 0) throw new Error('User not found');

        const updated = {...state.users[index], ...payload, id};
        state.users[index] = updated;
        this.save(state);
        return this.clone(updated);
      })
    );
  }

  deleteUser(id: string): Observable<User> {
    return this.state$().pipe(
      map(state => {
        const user = state.users.find(item => item.id === id);
        if (!user) throw new Error('User not found');
        state.users = state.users.filter(item => item.id !== id);
        this.save(state);
        return this.clone(user);
      })
    );
  }

  login(login: string, password: string): Observable<User> {
    return this.state$().pipe(
      map(state => {
        const user = state.users.find(item =>
          (item.login === login || item.email === login || item.phone === login) &&
          item.password === password &&
          item.status !== 'INACTIVE'
        );

        if (!user) throw new Error('Invalid local credentials');
        return this.clone(user);
      })
    );
  }

  getBilling(): Observable<MonthlyCharge[]> {
    return this.state$().pipe(map(state => this.clone(this.billingFromState(state))));
  }

  getCustomerBilling(customerId: string): Observable<MonthlyCharge[]> {
    return this.state$().pipe(
      map(state => this.clone(this.billingFromState(state).filter(item => item.id.startsWith(`charge-${customerId}-`))))
    );
  }

  getCustomerUnpaidMonths(customerId: string): Observable<MonthlyCharge[]> {
    return this.state$().pipe(
      map(state => this.clone(this.billingFromState(state)
        .filter(item => item.id.startsWith(`charge-${customerId}-`) && !item.paid)))
    );
  }

  getCustomerMonth(customerId: string, referenceMonth: string): Observable<MonthlyCharge> {
    return this.getCustomerBilling(customerId).pipe(
      map(items => {
        const month = items.find(item => item.referenceMonth === referenceMonth);
        if (!month) throw new Error('Month not found');
        return month;
      })
    );
  }

  getCustomerDebtCount(customerId: string): Observable<number> {
    return this.getCustomerUnpaidMonths(customerId).pipe(map(items => items.filter(item => isOverdueMonth(item.referenceMonth)).length));
  }

  exportState(format: 'json' | 'txt' = 'json'): string {
    const state = this.readStoredState() || this.cloneState(this.sourceState || this.seedState());
    const payload = {
      exportedAt: new Date().toISOString(),
      sourceVersion: this.sourceState?.version || 'local',
      state
    };

    return format === 'txt'
      ? JSON.stringify(payload, null, 2)
      : JSON.stringify(payload);
  }

  resetLocalData(): void {
    if (this.canUseLocalStorage()) {
      localStorage.removeItem(this.storageKey);
    }
  }

  private state$(): Observable<WaterState> {
    this.isLocalMode$.next(true);
    const stored = this.readStoredState();

    if (stored) {
      return of(this.recoverBilling(stored));
    }

    if (this.sourceState) {
      const state = this.recoverBilling(this.cloneState(this.sourceState));
      this.save(state);
      return of(state);
    }

    return this.http.get<WaterSourceState>(this.dataSourcePath).pipe(
      map(source => this.normalizeSourceState(source)),
      tap(source => this.sourceState = source),
      map(source => {
        const state = this.recoverBilling(this.cloneState(source));
        this.save(state);
        return state;
      }),
      catchError(() => {
        const source = this.seedState();
        this.sourceState = source;
        const state = this.cloneState(source);
        this.save(state);
        return of(state);
      })
    );
  }

  private recoverBilling(state: WaterState): WaterState {
    const recovered = recoverLocalBilling(state.customers, state.payments);
    if (JSON.stringify(recovered) !== JSON.stringify(state.customers)) {
      state.customers = recovered;
      this.save(state);
    }
    return state;
  }

  syncBilling(): Observable<string> {
    return this.state$().pipe(map(() => 'Mensalidades de demonstração atualizadas localmente.'));
  }

  private normalizeSourceState(source: WaterSourceState): WaterSourceState {
    return {
      version: source.version || `water-seed-${environment.name || 'local'}`,
      customers: source.customers || [],
      payments: source.payments || [],
      receipts: source.receipts || [],
      users: source.users || []
    };
  }

  private seedState(): WaterSourceState {
    return {
      version: `fallback-seed-${environment.name || 'local'}`,
      customers: [],
      payments: [],
      receipts: [],
      users: [{
        id: 'user-admin',
        name: 'Administrador',
        password: 'admin123',
        email: 'admin@watersystem.local',
        status: 'ACTIVE',
        phone: '+258 84 000 0000',
        login: 'admin',
        role: 'ADMIN',
        createdAt: new Date().toISOString()
      }]
    };
  }

  private cloneState(source: WaterSourceState): WaterState {
    return this.clone({
      customers: source.customers,
      payments: source.payments,
      receipts: source.receipts,
      users: source.users
    });
  }

  private readStoredState(): WaterState | null {
    if (!this.canUseLocalStorage()) return null;

    const raw = localStorage.getItem(this.storageKey);
    if (!raw) return null;

    try {
      const parsed = JSON.parse(raw) as WaterStorageEnvelope | WaterState;
      if (this.isStorageEnvelope(parsed)) {
        return this.clone(parsed.state);
      }

      return this.clone(parsed);
    } catch {
      localStorage.removeItem(this.storageKey);
      return null;
    }
  }

  private save(state: WaterState): void {
    if (!this.canUseLocalStorage()) return;

    const envelope: WaterStorageEnvelope = {
      sourceVersion: this.sourceState?.version || `water-local-${environment.name || 'local'}`,
      state
    };
    localStorage.setItem(this.storageKey, JSON.stringify(envelope));
  }

  private isStorageEnvelope(value: WaterStorageEnvelope | WaterState): value is WaterStorageEnvelope {
    return !!value && typeof value === 'object' && 'sourceVersion' in value && 'state' in value;
  }

  private receiptFromPayment(payment: Payment): Recibo {
    return {
      id: this.id('receipt'),
      invoiceCode: payment.referenceCode,
      paymentId: payment.id,
      payment: this.clone(payment),
      customerName: payment.customerName,
      fileName: `RECIBO_${payment.referenceCode}.pdf`,
      filePath: `local://receipts/${payment.referenceCode}`,
      total: `${Number(payment.amount || 0).toFixed(2)} MT`,
      monthDescription: payment.referenceMonth || '-',
      createdAt: payment.paymentDate || new Date().toISOString()
    };
  }

  private hydrateReceipts(state: WaterState): Recibo[] {
    return state.receipts.map(receipt => ({
      ...receipt,
      payment: receipt.payment || state.payments.find(payment => payment.id === receipt.paymentId)!
    }));
  }

  private billingFromState(state: WaterState): MonthlyCharge[] {
    const unpaid = state.customers.flatMap(customer =>
      (customer.unpaidMonths || []).map(month => this.chargeFromCustomer(customer, month, false))
    );

    const paid = state.payments.filter(payment => payment.confirmed).map(payment => this.chargeFromPayment(payment));
    return [...unpaid, ...paid].sort((a, b) => b.referenceMonth.localeCompare(a.referenceMonth));
  }

  private chargeFromCustomer(customer: Customer, referenceMonth: string, paid: boolean): MonthlyCharge {
    return {
      id: `charge-${customer.id}-${referenceMonth}`,
      referenceMonth,
      paid,
      paidAt: '',
      amount: Number(customer.monthlyFee || 0),
      customerNameSnapshot: customer.name,
      customerContactSnapshot: customer.contact,
      customerAddressSnapshot: customer.address,
      valveSnapshot: String(customer.valve || ''),
      customerStatusSnapshot: customer.status,
      paymentId: '',
      paymentReferenceCode: '',
      paymentMethod: '',
      createdByName: '',
      paymentDate: ''
    };
  }

  private chargeFromPayment(payment: Payment): MonthlyCharge {
    const firstMonth = (payment.referenceMonth || '').split('|')[0] || this.currentMonthKey();

    return {
      id: `charge-${payment.customerId}-${firstMonth}-${payment.id}`,
      referenceMonth: firstMonth,
      paid: true,
      paidAt: payment.paymentDate,
      amount: Number(payment.amount || 0),
      customerNameSnapshot: payment.customerName,
      customerContactSnapshot: payment.customerContact,
      customerAddressSnapshot: payment.customerAddress,
      valveSnapshot: String(payment.customerValve || ''),
      customerStatusSnapshot: 'ATIVO',
      paymentId: payment.id,
      paymentReferenceCode: payment.referenceCode,
      paymentMethod: payment.paymentMethod,
      createdByName: payment.createdByName,
      paymentDate: payment.paymentDate
    };
  }

  private syncPaymentCustomerSnapshots(state: WaterState, customer: Customer): void {
    state.payments = state.payments.map(payment => payment.customerId === customer.id ? {
      ...payment,
      customerName: customer.name,
      customerContact: customer.contact,
      customerAddress: customer.address,
      customerValve: customer.valve,
      monthlyFee: customer.monthlyFee
    } : payment);
    state.receipts = state.receipts.map(receipt => ({
      ...receipt,
      payment: state.payments.find(payment => payment.id === receipt.paymentId) || receipt.payment
    }));
  }

  private ensureUnpaidMonths(current: string[], count: number): string[] {
    const normalized = current.filter(Boolean);
    if (normalized.length >= count) {
      return normalized.slice(0, count);
    }

    const months = [...normalized];
    let cursor = new Date();
    cursor.setDate(1);
    cursor.setMonth(cursor.getMonth() - 1);

    while (months.length < count) {
      const key = `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, '0')}`;
      if (!months.includes(key)) {
        months.unshift(key);
      }
      cursor.setMonth(cursor.getMonth() - 1);
    }

    return months.sort();
  }

  private nextCustomerCode(customers: Customer[]): string {
    const next = customers.length + 1;
    return `WSM-${String(next).padStart(3, '0')}`;
  }

  private nextReceiptCode(next: number): string {
    return `REC-${new Date().getFullYear()}-${String(next).padStart(4, '0')}`;
  }

  private currentMonthKey(): string {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  }

  private id(prefix: string): string {
    return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  }

  private clone<T>(value: T): T {
    return JSON.parse(JSON.stringify(value)) as T;
  }

  private canUseLocalStorage(): boolean {
    return typeof localStorage !== 'undefined';
  }
}
