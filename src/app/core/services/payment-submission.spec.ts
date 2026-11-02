import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { PaymentService } from './payments/payment.service';
import { AuthSessionService } from '../auth/auth-session.service';
import { PermissionService } from '../auth/permission.service';
import { environment } from '../../../environments/environments';
describe('Payment submission retry identity', () => {
  let http: HttpTestingController, service: PaymentService, saved: string | null;
  const key = environment.waterStorageKey + '-pending-payments';
  const payload = {
    customerId: 'c1',
    numMonths: 1,
    amount: 500,
    paymentMethod: 'CASH',
    paymentDate: '2026-11-01T08:00:00Z',
  };
  beforeEach(() => {
    saved = localStorage.getItem(key);
    localStorage.removeItem(key);
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        {
          provide: AuthSessionService,
          useValue: { getUser: () => ({ id: 'u1' }), getToken: () => 'api-token' },
        },
        { provide: PermissionService, useValue: { require: () => {} } },
      ],
    });
    http = TestBed.inject(HttpTestingController);
    service = TestBed.inject(PaymentService);
  });
  afterEach(() => {
    http.verify();
    if (saved === null) localStorage.removeItem(key);
    else localStorage.setItem(key, saved);
  });
  it('reuses the original body and idempotency key after a network failure, clearing only on confirmation', () => {
    service.addPayment(payload).subscribe({ error: () => {} });
    const first = http.expectOne(environment.baseURL + '/payments');
    const identity = first.request.headers.get('Idempotency-Key');
    expect(identity).toBeTruthy();
    first.error(new ProgressEvent('network'));
    service.addPayment({ ...payload, paymentDate: '2026-11-01T09:00:00Z' }).subscribe();
    const retry = http.expectOne(environment.baseURL + '/payments');
    expect(retry.request.headers.get('Idempotency-Key')).toBe(identity);
    expect(retry.request.body.paymentDate).toBe(payload.paymentDate);
    retry.flush({ id: 'p1' });
    expect(localStorage.getItem(key)).toBe('{}');
    service.addPayment(payload).subscribe();
    const fresh = http.expectOne(environment.baseURL + '/payments');
    expect(fresh.request.headers.get('Idempotency-Key')).not.toBe(identity);
    fresh.flush({ id: 'p2' });
  });
});
