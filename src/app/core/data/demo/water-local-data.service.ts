import { COMPANY_PROFILE } from '@shared/config/company-profile';
import { paymentPeriods, isBillingPeriod } from '@shared/utils/billing-period';
import { maputoMonthKey } from '@shared/utils/business-date';
import { PermissionService } from '@core/auth/permission.service';
import { AuthSessionService } from '@core/auth/auth-session.service';
import { DEMO_USERS } from '@shared/config/demo-users';
import { HttpErrorResponse } from '@angular/common/http';
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, catchError, map, of, tap, throwError } from 'rxjs';

import { environment } from '../../../../environments/environments';
import { MonthlyCharge } from '@shared/models/monthly-charge';
import { Customer } from '@shared/models/customer';
import type { CustomerPayload } from '@core/services/customers/customer.service';
import { Payment } from '@shared/models/payment';
import type { PaymentPayload } from '@core/services/payments/payment.service';
import { Recibo } from '@shared/models/receipt';
import { User } from '@shared/models/user';
import { isOverdueMonth, recoverLocalBilling } from '@shared/utils/billing-recovery';

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

type UserPayload = Partial<
  Pick<User, 'name' | 'email' | 'phone' | 'login' | 'password' | 'role' | 'status'>
>;

@Injectable({
  providedIn: 'root',
})
export class WaterLocalDataService {
  readonly isLocalMode$ = new BehaviorSubject(false);
  private readonly storageKey = environment.waterStorageKey;
  private readonly dataSourcePath = environment.waterDataSourcePath;
  private sourceState: WaterSourceState | null = null;

  constructor(
    private http: HttpClient,
    private permissions: PermissionService,
    private session: AuthSessionService,
  ) {}

  getCustomers(): Observable<Customer[]> {
    this.permissions.require('customers.read');
    return this.state$().pipe(map((state) => this.clone(state.customers)));
  }

  getCustomerById(id: string): Observable<Customer> {
    this.permissions.require('customers.read');
    return this.state$().pipe(
      map((state) => {
        const customer = state.customers.find((item) => item.id === id);
        if (!customer) throw new Error('Customer not found');
        return this.clone(customer);
      }),
    );
  }

  addCustomer(payload: CustomerPayload): Observable<Customer> {
    this.permissions.require('customers.create');
    return this.state$().pipe(
      map((state) => {
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
          createdAt: new Date().toISOString(),
        };

        state.customers.unshift(created);
        this.save(state);
        return this.clone(created);
      }),
    );
  }

  updateCustomer(id: string, payload: CustomerPayload): Observable<Customer> {
    this.permissions.require('customers.edit');
    return this.state$().pipe(
      map((state) => {
        const index = state.customers.findIndex((item) => item.id === id);
        if (index < 0) throw new Error('Customer not found');

        const current = state.customers[index];
        if (
          !this.permissions.can('tariffs.manage') &&
          payload.monthlyFee !== undefined &&
          Number(payload.monthlyFee) !== Number(current.monthlyFee)
        )
          throw new HttpErrorResponse({ status: 403 });
        if (
          !this.permissions.can('customers.lifecycle') &&
          ((payload.status !== undefined && payload.status !== current.status) ||
            (payload.valve !== undefined && Number(payload.valve) !== Number(current.valve)))
        )
          throw new HttpErrorResponse({ status: 403 });
        if (
          payload.monthsInDebt !== undefined &&
          Number(payload.monthsInDebt) !== Number(current.monthsInDebt)
        )
          throw new HttpErrorResponse({
            status: 409,
            statusText: 'A dívida é calculada pelas mensalidades.',
          });
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
          unpaidMonths: this.ensureUnpaidMonths(current.unpaidMonths || [], monthsInDebt),
        };

        state.customers[index] = updated;
        this.save(state);
        return this.clone(updated);
      }),
    );
  }

  deleteCustomer(id: string): Observable<Customer> {
    throw new HttpErrorResponse({ status: 403, statusText: 'O histórico não pode ser eliminado.' });
  }

  getPayments(): Observable<Payment[]> {
    this.permissions.require('payments.read');
    return this.state$().pipe(
      map((state) =>
        this.clone(
          state.payments.filter(
            (payment) =>
              this.permissions.can('reports.financial') ||
              payment.createdBy === this.session.getUser()?.id,
          ),
        ),
      ),
    );
  }

  getCustomerPayments(customerId: string): Observable<Payment[]> {
    this.permissions.require('payments.read');
    return this.state$().pipe(
      map((state) =>
        this.clone(state.payments.filter((payment) => payment.customerId === customerId)),
      ),
    );
  }

  getPaymentById(id: string): Observable<Payment> {
    this.permissions.require('payments.read');
    return this.state$().pipe(
      map((state) => {
        const payment = state.payments.find((item) => item.id === id);
        if (!payment) throw new Error('Payment not found');
        return this.clone(payment);
      }),
    );
  }

  addPayment(payload: PaymentPayload): Observable<Payment> {
    this.permissions.require('payments.create');
    return this.state$().pipe(
      map((state) => {
        const customer = state.customers.find((item) => item.id === payload.customerId);
        if (!customer) throw new Error('Customer not found');

        const numMonths = Number(payload.numMonths ?? 1);
        if (!Number.isInteger(numMonths) || numMonths < 1)
          throw new HttpErrorResponse({ status: 422, statusText: 'Número de meses inválido.' });
        const months = this.ensureUnpaidMonths(
          customer.unpaidMonths || [],
          Math.max(customer.monthsInDebt || 0, numMonths),
        ).slice(0, numMonths);
        const amount = Number(payload.amount ?? customer.monthlyFee * numMonths);
        if (
          !Number.isInteger(numMonths) ||
          numMonths < 1 ||
          !Number.isFinite(amount) ||
          Math.abs(amount - Number(customer.monthlyFee) * numMonths) > 0.001
        )
          throw new HttpErrorResponse({
            status: 422,
            statusText: 'O valor recebido deve corresponder aos meses selecionados.',
          });
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
          confirmed: true,
          referenceMonth: months.join('|') || this.currentMonthKey(),
          numMonths,
          periodAmounts: Object.fromEntries(
            months.map((period) => [period, Number(customer.monthlyFee)]),
          ),
          paymentDate: payload.paymentDate || new Date().toISOString(),
          paymentMethod: payload.paymentMethod || 'CASH',
          createdBy: this.session.getUser()?.id || '',
          createdByName: this.session.getUser()?.name || '',
        };

        customer.unpaidMonths = (customer.unpaidMonths || []).filter(
          (month) => !months.includes(month),
        );
        customer.monthsInDebt = customer.unpaidMonths.length;
        state.payments.unshift(payment);
        state.receipts.unshift(this.receiptFromPayment(payment));
        this.save(state);
        return this.clone(payment);
      }),
    );
  }

  deletePayment(id: string): Observable<Payment> {
    throw new HttpErrorResponse({ status: 403, statusText: 'O histórico não pode ser eliminado.' });
  }

  getReceipts(): Observable<Recibo[]> {
    this.permissions.require('documents.issue');
    return this.state$().pipe(
      map((state) =>
        this.clone(
          this.hydrateReceipts(state).filter(
            (receipt) =>
              this.permissions.can('reports.financial') ||
              receipt.payment?.createdBy === this.session.getUser()?.id,
          ),
        ),
      ),
    );
  }

  getReceiptsByPayment(paymentId: string): Observable<Recibo[]> {
    this.permissions.require('documents.issue');
    return this.state$().pipe(
      map((state) =>
        this.clone(
          this.hydrateReceipts(state).filter((receipt) => receipt.paymentId === paymentId),
        ),
      ),
    );
  }

  getReceiptById(id: string): Observable<Recibo> {
    this.permissions.require('documents.issue');
    return this.state$().pipe(
      map((state) => {
        const receipt = this.hydrateReceipts(state).find((item) => item.id === id);
        if (!receipt) throw new Error('Receipt not found');
        return this.clone(receipt);
      }),
    );
  }

  addReceipt(paymentId: string): Observable<Recibo> {
    this.permissions.require('documents.issue');
    return this.state$().pipe(
      map((state) => {
        const payment = state.payments.find((item) => item.id === paymentId);
        if (!payment) throw new Error('Payment not found');

        const existing = state.receipts.find((item) => item.paymentId === paymentId);
        if (existing) return this.clone({ ...existing, payment });

        const receipt = this.receiptFromPayment(payment);
        state.receipts.unshift(receipt);
        this.save(state);
        return this.clone(receipt);
      }),
    );
  }

  deleteReceipt(id: string): Observable<Recibo> {
    throw new HttpErrorResponse({ status: 403, statusText: 'O histórico não pode ser eliminado.' });
  }

  getUsers(): Observable<User[]> {
    this.permissions.require('users.manage');
    return this.state$().pipe(map((state) => this.clone(state.users)));
  }

  getUserById(id: string): Observable<User | undefined> {
    if (id !== this.session.getUser()?.id) this.permissions.require('users.manage');
    return this.state$().pipe(
      map((state) => this.clone(state.users.find((user) => user.id === id))),
    );
  }

  addUser(payload: UserPayload): Observable<User> {
    this.permissions.require('users.manage');
    return this.state$().pipe(
      map((state) => {
        const login =
          payload.login || (payload.name || '').trim().split(/\s+/)[0].toLowerCase() + 'AC';
        if (state.users.some((user) => user.login === login))
          throw new HttpErrorResponse({ status: 409, statusText: 'Login já utilizado' });
        const created: User = {
          id: this.id('user'),
          name: payload.name || '',
          email: payload.email || '',
          phone: payload.phone || '',
          login,
          password: payload.password || '123456',
          role: payload.role || 'OPERATOR',
          status: payload.status || 'ACTIVE',
          createdAt: new Date().toISOString(),
        };

        state.users.unshift(created);
        this.save(state);
        return this.clone(created);
      }),
    );
  }

  updateUser(id: string, payload: UserPayload): Observable<User> {
    this.permissions.require('users.manage');
    return this.state$().pipe(
      map((state) => {
        const index = state.users.findIndex((user) => user.id === id);
        if (index < 0) throw new Error('User not found');

        this.checkUserChange(state, state.users[index], payload);
        const updated = { ...state.users[index], ...payload, id };
        state.users[index] = updated;
        this.save(state);
        return this.clone(updated);
      }),
    );
  }

  deleteUser(id: string): Observable<User> {
    this.permissions.require('users.manage');
    return this.state$().pipe(
      map((state) => {
        const user = state.users.find((item) => item.id === id);
        if (!user) throw new Error('User not found');
        this.checkUserChange(state, user, { status: 'INACTIVE' });
        user.status = 'INACTIVE';
        this.save(state);
        return this.clone(user);
      }),
    );
  }

  login(login: string, password: string): Observable<User> {
    return this.state$().pipe(
      map((state) => {
        const user = state.users.find(
          (item) =>
            (item.login === login || item.email === login || item.phone === login) &&
            item.password === password &&
            item.status === 'ACTIVE',
        );

        if (!user) throw new Error('Invalid local credentials');
        return this.clone(user);
      }),
    );
  }

  getBilling(): Observable<MonthlyCharge[]> {
    this.permissions.require('reports.financial');
    return this.state$().pipe(map((state) => this.clone(this.billingFromState(state))));
  }

  getCustomerBilling(customerId: string): Observable<MonthlyCharge[]> {
    this.permissions.require('customers.read');
    return this.state$().pipe(
      map((state) =>
        this.clone(
          this.billingFromState(state).filter((item) =>
            item.id.startsWith(`charge-${customerId}-`),
          ),
        ),
      ),
    );
  }

  getCustomerUnpaidMonths(customerId: string): Observable<MonthlyCharge[]> {
    this.permissions.require('customers.read');
    return this.state$().pipe(
      map((state) =>
        this.clone(
          this.billingFromState(state).filter(
            (item) => item.id.startsWith(`charge-${customerId}-`) && !item.paid,
          ),
        ),
      ),
    );
  }

  getCustomerMonth(customerId: string, referenceMonth: string): Observable<MonthlyCharge> {
    return this.getCustomerBilling(customerId).pipe(
      map((items) => {
        const month = items.find((item) => item.referenceMonth === referenceMonth);
        if (!month) throw new Error('Month not found');
        return month;
      }),
    );
  }

  getCustomerDebtCount(customerId: string): Observable<number> {
    return this.getCustomerUnpaidMonths(customerId).pipe(
      map((items) => items.filter((item) => isOverdueMonth(item.referenceMonth)).length),
    );
  }

  exportState(format: 'json' | 'txt' = 'json'): string {
    this.permissions.require('users.manage');
    const stored = this.readStoredState();
    if (!stored && !this.sourceState) throw new Error('Carregue os dados antes de exportar.');
    const state = stored || this.cloneState(this.sourceState!);
    const payload = {
      exportedAt: new Date().toISOString(),
      sourceVersion: this.sourceState?.version || 'local',
      company: this.readCompanyBackup(),
      state,
    };

    return format === 'txt' ? JSON.stringify(payload, null, 2) : JSON.stringify(payload);
  }

  exportRawBackup(): string {
    this.permissions.require('users.manage');
    return JSON.stringify({
      exportedAt: new Date().toISOString(),
      raw: typeof localStorage === 'undefined' ? null : localStorage.getItem(this.storageKey),
      company: this.readCompanyBackup(),
    });
  }
  private readCompanyBackup(): unknown {
    const raw =
      typeof localStorage === 'undefined'
        ? null
        : localStorage.getItem(this.storageKey + '-company');
    if (!raw) return { ...COMPANY_PROFILE, version: null, updatedAt: null, updatedBy: null };
    try {
      return JSON.parse(raw);
    } catch {
      return { raw };
    }
  }
  restoreBackup(raw: string): void {
    this.permissions.require('users.manage');
    if (environment.production || !environment.useLocalFallback)
      throw new Error('A importação local está desativada.');
    const parsed = JSON.parse(raw);
    const state = parsed.state;
    if (
      !state ||
      !['customers', 'payments', 'receipts', 'users'].every((key) => Array.isArray(state[key]))
    )
      throw new Error('Ficheiro inválido.');
    for (const key of ['customers', 'payments', 'receipts', 'users']) {
      const ids = state[key].map((item: { id?: string }) => item?.id);
      if (
        ids.some((id: unknown) => typeof id !== 'string' || !id) ||
        new Set(ids).size !== ids.length
      )
        throw new Error('Identificadores inválidos ou duplicados.');
    }
    if (
      state.customers.some(
        (c: Customer) =>
          !Array.isArray(c.unpaidMonths) ||
          c.unpaidMonths.some((m) => !isBillingPeriod(m)) ||
          !Number.isFinite(c.monthlyFee) ||
          c.monthlyFee < 0,
      )
    )
      throw new Error('Dados de cliente inválidos.');
    if (
      state.payments.some(
        (p: Payment) =>
          !Number.isFinite(p.amount) ||
          p.amount < 0 ||
          typeof p.referenceCode !== 'string' ||
          typeof p.confirmed !== 'boolean',
      )
    )
      throw new Error('Dados de pagamento inválidos.');
    if (!state.users.some((u: User) => u.role === 'ADMIN' && u.status === 'ACTIVE' && u.password))
      throw new Error('A cópia precisa de um administrador local com credencial.');
    const customers = new Set(state.customers.map((c: Customer) => c.id));
    const payments = new Set(state.payments.map((p: Payment) => p.id));
    if (
      state.payments.some((p: Payment) => !customers.has(p.customerId)) ||
      state.receipts.some((r: Recibo) => !payments.has(r.paymentId))
    )
      throw new Error('Referências incompletas.');
    const original = localStorage.getItem(this.storageKey),
      companyKey = this.storageKey + '-company',
      oldCompany = localStorage.getItem(companyKey);
    // Preserve the exact original bytes before replacement; a quota error aborts import.
    localStorage.setItem(
      this.storageKey + '-before-import-' + Date.now(),
      JSON.stringify({ raw: original, company: oldCompany }),
    );
    const company = parsed.company || state.company;
    try {
      localStorage.setItem(
        this.storageKey,
        JSON.stringify({ sourceVersion: parsed.sourceVersion || 'imported', state }),
      );
      if (company && typeof company.name === 'string')
        localStorage.setItem(companyKey, JSON.stringify(company));
    } catch (error) {
      if (original === null) localStorage.removeItem(this.storageKey);
      else localStorage.setItem(this.storageKey, original);
      if (oldCompany === null) localStorage.removeItem(companyKey);
      else localStorage.setItem(companyKey, oldCompany);
      throw error;
    }
  }

  resetLocalData(): void {
    this.permissions.require('users.manage');
    if (this.canUseLocalStorage()) {
      localStorage.removeItem(this.storageKey);
    }
  }

  private checkUserChange(state: WaterState, user: User, payload: UserPayload): void {
    const role = payload.role ?? user.role;
    const status = payload.status ?? user.status;
    if (user.id === this.session.getUser()?.id && (role !== user.role || status !== 'ACTIVE'))
      throw new HttpErrorResponse({
        status: 409,
        statusText: 'Não pode desativar ou alterar o seu próprio perfil de acesso.',
      });
    if (
      user.role === 'ADMIN' &&
      user.status === 'ACTIVE' &&
      (role !== 'ADMIN' || status !== 'ACTIVE') &&
      state.users.filter((item) => item.role === 'ADMIN' && item.status === 'ACTIVE').length <= 1
    )
      throw new HttpErrorResponse({
        status: 409,
        statusText: 'É necessário manter um administrador ativo.',
      });
  }

  private state$(): Observable<WaterState> {
    if (environment.production || !environment.useLocalFallback) {
      return throwError(
        () =>
          new HttpErrorResponse({
            status: 403,
            statusText: 'Os dados de demonstração estão desativados neste ambiente.',
          }),
      );
    }
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
      map((source) => this.normalizeSourceState(source)),
      tap((source) => (this.sourceState = source)),
      map((source) => {
        const state = this.recoverBilling(this.cloneState(source));
        this.save(state);
        return state;
      }),
      catchError((error) => throwError(() => error)),
    );
  }

  private recoverBilling(state: WaterState): WaterState {
    if (!environment.production && environment.useLocalFallback) {
      for (const user of DEMO_USERS)
        if (!state.users.some((existing) => existing.login === user.login))
          state.users.push(this.clone(user));
      this.save(state);
    }
    const recovered = recoverLocalBilling(state.customers, state.payments);
    if (JSON.stringify(recovered) !== JSON.stringify(state.customers)) {
      state.customers = recovered;
      this.save(state);
    }
    return state;
  }

  syncBilling(): Observable<string> {
    this.permissions.require('billing.generate');
    return this.state$().pipe(map(() => 'Mensalidades de demonstração atualizadas localmente.'));
  }

  private normalizeSourceState(source: WaterSourceState): WaterSourceState {
    return {
      version: source.version || `water-seed-${environment.name || 'local'}`,
      customers: source.customers || [],
      payments: source.payments || [],
      receipts: source.receipts || [],
      users: source.users || [],
    };
  }

  private seedState(): WaterSourceState {
    return {
      version: `fallback-seed-${environment.name || 'local'}`,
      customers: [],
      payments: [],
      receipts: [],
      users: [
        {
          id: 'user-admin',
          name: 'Administrador',
          password: 'admin123',
          email: 'admin@watersystem.local',
          status: 'ACTIVE',
          phone: '+258 84 000 0000',
          login: 'admin',
          role: 'ADMIN',
          createdAt: new Date().toISOString(),
        },
      ],
    };
  }

  private cloneState(source: WaterSourceState): WaterState {
    return this.clone({
      customers: source.customers,
      payments: source.payments,
      receipts: source.receipts,
      users: source.users,
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
      throw new HttpErrorResponse({
        status: 409,
        statusText:
          'Os dados locais estão danificados. Exporte a cópia original antes de restaurar; nenhum dado foi apagado.',
      });
    }
  }

  private save(state: WaterState): void {
    if (!this.canUseLocalStorage()) return;

    const envelope: WaterStorageEnvelope = {
      sourceVersion: this.sourceState?.version || `water-local-${environment.name || 'local'}`,
      state,
    };
    localStorage.setItem(this.storageKey, JSON.stringify(envelope));
  }

  private isStorageEnvelope(
    value: WaterStorageEnvelope | WaterState,
  ): value is WaterStorageEnvelope {
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
      createdAt: payment.paymentDate || new Date().toISOString(),
    };
  }

  private hydrateReceipts(state: WaterState): Recibo[] {
    return state.receipts.map((receipt) => ({
      ...receipt,
      payment:
        receipt.payment || state.payments.find((payment) => payment.id === receipt.paymentId)!,
    }));
  }

  private billingFromState(state: WaterState): MonthlyCharge[] {
    const unpaid = state.customers.flatMap((customer) =>
      (customer.unpaidMonths || []).map((month) => this.chargeFromCustomer(customer, month, false)),
    );

    const paid = state.payments
      .filter((payment) => payment.confirmed)
      .flatMap((payment) =>
        paymentPeriods(payment.referenceMonth).map((period) =>
          this.chargeFromPayment(payment, period),
        ),
      );
    return [...unpaid, ...paid].sort((a, b) => b.referenceMonth.localeCompare(a.referenceMonth));
  }

  private chargeFromCustomer(
    customer: Customer,
    referenceMonth: string,
    paid: boolean,
  ): MonthlyCharge {
    return {
      id: `charge-${customer.id}-${referenceMonth}`,
      customerId: customer.id,
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
      paymentDate: '',
    };
  }

  private chargeFromPayment(payment: Payment, firstMonth: string): MonthlyCharge {
    const periods = paymentPeriods(payment.referenceMonth);
    const index = periods.indexOf(firstMonth);
    const cents = Math.round(Number(payment.amount || 0) * 100);
    const count = Math.max(periods.length, 1);
    const estimated = (Math.floor(cents / count) + (index < cents % count ? 1 : 0)) / 100;

    return {
      id: `charge-${payment.customerId}-${firstMonth}-${payment.id}`,
      customerId: payment.customerId,
      referenceMonth: firstMonth,
      paid: true,
      paidAt: payment.paymentDate,
      amount: payment.periodAmounts?.[firstMonth] ?? estimated,
      amountEstimated: payment.periodAmounts?.[firstMonth] === undefined && periods.length > 1,
      customerNameSnapshot: payment.customerName,
      customerContactSnapshot: payment.customerContact,
      customerAddressSnapshot: payment.customerAddress,
      valveSnapshot: String(payment.customerValve || ''),
      customerStatusSnapshot: 'ATIVO',
      paymentId: payment.id,
      paymentReferenceCode: payment.referenceCode,
      paymentMethod: payment.paymentMethod,
      createdByName: payment.createdByName,
      paymentDate: payment.paymentDate,
    };
  }

  private ensureUnpaidMonths(current: string[], count: number): string[] {
    const months = [...new Set(current.filter(isBillingPeriod))].sort();
    if (months.length >= count) return months;
    let [year, month] = this.currentMonthKey().split('-').map(Number);
    while (months.length < count) {
      if (month === 1) {
        year--;
        month = 12;
      } else month--;
      const key = year + '-' + String(month).padStart(2, '0');
      if (!isBillingPeriod(key)) throw new Error('Período fora do intervalo 2012–2099.');
      if (!months.includes(key)) months.push(key);
    }
    return months.sort();
  }

  private nextCustomerCode(customers: Customer[]): string {
    const next = customers.length + 1;
    return `WSM-${String(next).padStart(3, '0')}`;
  }

  private nextReceiptCode(next: number): string {
    return `REC-${Number(this.currentMonthKey().slice(0, 4))}-${String(next).padStart(4, '0')}`;
  }

  private currentMonthKey(): string {
    return maputoMonthKey(new Date());
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
