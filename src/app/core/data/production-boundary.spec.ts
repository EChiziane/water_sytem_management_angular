import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { environment } from '../../../environments/environments';
import { environment as production } from '../../../environments/environment.prod';
import { DataModeService } from './data-mode.service';
import { AuthSessionService } from '../auth/auth-session.service';
import { PermissionService } from '../auth/permission.service';
import { WaterLocalDataService } from '@core/data/demo/water-local-data.service';
import { AuthService } from '../auth/auth.service';

describe('Explicit browser data mode in production', () => {
  let saved: typeof environment;
  let session: jasmine.SpyObj<AuthSessionService>;
  beforeEach(() => {
    saved = { ...environment };
    Object.assign(environment, production);
    session = jasmine.createSpyObj('Session', ['getToken', 'setToken', 'setUser', 'clear']);
    session.getToken.and.returnValue('local-water-session');
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: AuthSessionService, useValue: session },
        { provide: PermissionService, useValue: { require: () => {} } },
      ],
    });
  });
  afterEach(() => {
    Object.assign(environment, saved);
    TestBed.inject(HttpTestingController).verify();
  });
  it('ships browser mode and a dedicated TXT without sharing the development storage key', () => {
    expect(production.production).toBeTrue();
    expect(production.dataMode).toBe('local');
    expect(production.waterDataSourcePath).toBe('/data/prod/water-data.txt');
    expect(production.waterStorageKey).not.toBe('water-system-management-state-development');
    expect(TestBed.inject(DataModeService).local).toBeTrue();
  });
  it('authenticates in browser mode without contacting Spring or Vercel', () => {
    const data = TestBed.inject(WaterLocalDataService);
    const user = {
      id: 'test-admin',
      login: 'admin',
      password: '123456',
      status: 'ACTIVE',
      role: 'ADMIN',
    } as any;
    spyOn(data, 'login').and.returnValue(of(user));
    let received: any;
    TestBed.inject(AuthService)
      .login('admin', '123456')
      .subscribe((u) => (received = u));
    expect(received.id).toBe('test-admin');
    expect(session.setToken).toHaveBeenCalledWith('local-water-session');
    TestBed.inject(HttpTestingController).expectNone((r) => r.url.startsWith(environment.baseURL));
  });
  it('keeps stored records and credentials ahead of the TXT in production browser mode', () => {
    const raw = JSON.stringify({
      sourceVersion: 'browser-test',
      state: {
        users: [
          {
            id: 'test-admin',
            login: 'admin',
            password: 'owner-pin',
            status: 'ACTIVE',
            role: 'ADMIN',
          },
        ],
        customers: [],
        payments: [],
        receipts: [],
      },
    });
    spyOn(Storage.prototype, 'getItem').and.callFake((key) =>
      key === environment.waterStorageKey ? raw : null,
    );
    const writes = spyOn(Storage.prototype, 'setItem');
    let id = '';
    TestBed.inject(WaterLocalDataService)
      .login('admin', 'owner-pin')
      .subscribe((u) => (id = u.id));
    expect(id).toBe('test-admin');
    expect(writes).not.toHaveBeenCalled();
    TestBed.inject(HttpTestingController).expectNone(environment.waterDataSourcePath);
  });
  it('still refuses browser financial data when API mode is explicitly selected', () => {
    environment.dataMode = 'vercel';
    const read = spyOn(Storage.prototype, 'getItem').and.callThrough();
    expect(TestBed.inject(DataModeService).local).toBeFalse();
    expect(TestBed.inject(DataModeService).canLoginLocally({ status: 0 })).toBeFalse();
    let status = 0;
    TestBed.inject(WaterLocalDataService)
      .getCustomers()
      .subscribe({ next: () => fail('unexpected local read'), error: (e) => (status = e.status) });
    expect(status).toBe(403);
    expect(read).not.toHaveBeenCalled();
  });
});
import { of } from 'rxjs';
