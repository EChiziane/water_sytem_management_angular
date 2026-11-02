import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ActivatedRouteSnapshot, Router } from '@angular/router';
import { AuthSessionService } from './auth-session.service';
import { PermissionService } from './permission.service';
import { PermissionGuard } from '../guards/permission.guard';
import { CustomerService } from '../services/customers/customer.service';
import { CompanyProfileService } from '../services/company/company-profile.service';
import { WaterLocalDataService } from '../data/demo/water-local-data.service';
import { AuthService } from './auth.service';
import { DEMO_USERS } from '@shared/config/demo-users';
import { UserRole } from '@shared/models/user';
import { environment } from '../../../environments/environments';

describe('Role boundaries', () => {
  let role: UserRole;
  let token: string;
  let http: HttpTestingController;
  let session: {
    getUser: () => any;
    getToken: () => string;
    hasValidSession: () => boolean;
    setToken: jasmine.Spy;
    setUser: jasmine.Spy;
    clear: jasmine.Spy;
  };
  const denied = (error: any) => expect(error.status).toBe(403);
  let originalMode: string;
  beforeEach(() => {
    originalMode = environment.dataMode;
    environment.dataMode = 'spring';
    role = 'ADMIN';
    token = 'api-token';
    session = {
      getUser: () => ({ ...DEMO_USERS.find((user) => user.role === role)! }),
      getToken: () => token,
      hasValidSession: () => true,
      setToken: jasmine.createSpy(),
      setUser: jasmine.createSpy(),
      clear: jasmine.createSpy(),
    };
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: AuthSessionService, useValue: session },
      ],
    });
    http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => {
    environment.dataMode = originalMode;
    http.verify();
  });
  it('reserves company and user administration exclusively to ADMIN', () => {
    const permissions = TestBed.inject(PermissionService);
    for (const candidate of ['ADMIN', 'MANAGER', 'OPERATOR', 'TECHNICIAN'] as UserRole[]) {
      role = candidate;
      expect(permissions.can('company.manage')).toBe(role === 'ADMIN');
      expect(permissions.can('users.manage')).toBe(role === 'ADMIN');
      expect(permissions.can('reports.financial')).toBe(['ADMIN', 'MANAGER'].includes(role));
      expect(permissions.can('payments.create')).toBe(role !== 'TECHNICIAN');
    }
  });
  it('blocks direct navigation to restricted pages', () => {
    role = 'OPERATOR';
    const router = TestBed.inject(Router);
    const route = { data: { permission: 'company.manage' } } as unknown as ActivatedRouteSnapshot;
    expect(router.serializeUrl(TestBed.inject(PermissionGuard).canActivate(route) as any)).toBe(
      '/app/access-denied',
    );
  });
  it('prevents a technician from fetching customers, including in demonstration mode', () => {
    role = 'TECHNICIAN';
    token = 'local-water-session';
    TestBed.inject(CustomerService)
      .getCustomers()
      .subscribe({ next: () => fail('Restricted data returned'), error: denied });
    http.expectNone(environment.baseURL + '/customers');
  });
  it('does not turn API authorization or availability failures into local financial data', () => {
    const local = TestBed.inject(WaterLocalDataService);
    spyOn(local, 'getCustomers');
    for (const status of [401, 403, 404, 500]) {
      let received = 0;
      TestBed.inject(CustomerService)
        .getCustomers()
        .subscribe({ error: (error) => (received = error.status) });
      http
        .expectOne(environment.baseURL + '/customers')
        .flush({}, { status, statusText: 'Rejected' });
      expect(received).toBe(status);
    }
    expect(local.getCustomers).not.toHaveBeenCalled();
  });
  it('does not downgrade invalid API login credentials into a local session', () => {
    const local = TestBed.inject(WaterLocalDataService);
    spyOn(local, 'login');
    TestBed.inject(AuthService)
      .login('anaAC', '123456')
      .subscribe({ error: () => {} });
    http
      .expectOne(environment.baseURL + '/auth/login')
      .flush({}, { status: 403, statusText: 'Forbidden' });
    expect(local.login).not.toHaveBeenCalled();
    expect(session.setToken).not.toHaveBeenCalled();
  });
  it('allows an operator to read issuer fields for documents without opening company administration', () => {
    role = 'OPERATOR';
    const company = TestBed.inject(CompanyProfileService);
    company.getProfile().subscribe({ next: () => fail(), error: denied });
    http.expectNone(environment.baseURL + '/company');
    company.getIssuerProfile().subscribe();
    http.expectOne(environment.baseURL + '/company/issuer').flush({ name: 'Águas Chiziane' });
  });
});

describe('Demonstration role accounts', () => {
  let saved: string | null;
  let http: HttpTestingController;
  let service: WaterLocalDataService;
  let actor = DEMO_USERS[0];
  const key = environment.waterStorageKey;
  beforeEach(() => {
    saved = localStorage.getItem(key);
    actor = DEMO_USERS[0];
    localStorage.setItem(
      key,
      JSON.stringify({
        customers: [],
        payments: [],
        receipts: [],
        users: [{ ...DEMO_USERS[0], password: 'existing-pin' }],
      }),
    );
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        {
          provide: AuthSessionService,
          useValue: { getUser: () => actor, getToken: () => 'local-water-session' },
        },
      ],
    });
    service = TestBed.inject(WaterLocalDataService);
    http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => {
    http.verify();
    if (saved === null) localStorage.removeItem(key);
    else localStorage.setItem(key, saved);
  });
  it('adds missing test roles once and preserves existing credentials', () => {
    service.getUsers().subscribe((users) => {
      expect(users.length).toBe(4);
      expect(users[0].password).toBe('existing-pin');
    });
    service
      .getUsers()
      .subscribe((users) => expect(new Set(users.map((user) => user.login)).size).toBe(4));
    for (const user of DEMO_USERS.slice(1))
      service.login(user.login, '123456').subscribe((found) => expect(found.role).toBe(user.role));
  });
  it('deactivates accounts without deleting historical identity and rejects subsequent logins', () => {
    service.deleteUser(DEMO_USERS[2].id).subscribe((user) => expect(user.status).toBe('INACTIVE'));
    service
      .getUsers()
      .subscribe((users) => expect(users.some((user) => user.id === DEMO_USERS[2].id)).toBeTrue());
    service
      .login('carlaAC', '123456')
      .subscribe({ next: () => fail(), error: (error) => expect(error).toBeTruthy() });
  });
  it('rejects self-deactivation and physical deletion of financial records', () => {
    service
      .deleteUser(actor.id)
      .subscribe({ next: () => fail(), error: (error) => expect(error.status).toBe(409) });
    expect(() => service.deletePayment('any')).toThrow();
    expect(() => service.deleteCustomer('any')).toThrow();
  });
  it('scopes the operator general payment list to their own operations', () => {
    actor = DEMO_USERS[2];
    const records = [
      { id: 'own', createdBy: actor.id },
      { id: 'other', createdBy: DEMO_USERS[1].id },
    ];
    const state = JSON.parse(localStorage.getItem(key)!);
    state.payments = records;
    localStorage.setItem(key, JSON.stringify(state));
    service
      .getPayments()
      .subscribe((payments) => expect(payments.map((payment) => payment.id)).toEqual(['own']));
  });
  it('does not let ADMIN bypass the received amount validation', () => {
    const state = JSON.parse(localStorage.getItem(key)!);
    state.customers = [
      {
        id: 'customer',
        name: 'Cliente',
        status: 'ATIVO',
        createdAt: new Date().toISOString(),
        monthlyFee: 750,
        unpaidMonths: [],
        monthsInDebt: 0,
      },
    ];
    localStorage.setItem(key, JSON.stringify(state));
    service.addPayment({ customerId: 'customer', numMonths: 1, amount: 0 }).subscribe({
      next: () => fail('Zero amount accepted'),
      error: (error) => expect(error.status).toBe(422),
    });
    expect(JSON.parse(localStorage.getItem(key)!).state.payments.length).toBe(0);
  });
  it('represents paid months from different years separately while preserving recorded historical allocations', () => {
    const state = JSON.parse(localStorage.getItem(key)!);
    state.payments = [
      {
        id: 'p',
        customerId: 'c',
        confirmed: true,
        amount: 1250,
        referenceMonth: '2025-12|2026-01',
        periodAmounts: { '2025-12': 500, '2026-01': 750 },
      },
    ];
    localStorage.setItem(key, JSON.stringify(state));
    service.getCustomerBilling('c').subscribe((periods) => {
      expect(periods.map((period) => period.referenceMonth)).toEqual(['2026-01', '2025-12']);
      expect(periods.map((period) => period.amount)).toEqual([750, 500]);
      expect(periods.every((period) => period.paid)).toBeTrue();
    });
  });
});
