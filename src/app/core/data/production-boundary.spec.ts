import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { environment } from '../../../environments/environments';
import { environment as production } from '../../../environments/environment.prod';
import { DataModeService } from './data-mode.service';
import { AuthSessionService } from '../auth/auth-session.service';
import { PermissionService } from '../auth/permission.service';
import { WaterLocalDataService } from '@core/data/demo/water-local-data.service';
describe('Production data boundary', () => {
  let originalProduction: boolean, originalFallback: boolean;
  beforeEach(() => {
    originalProduction = environment.production;
    originalFallback = environment.useLocalFallback;
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: AuthSessionService, useValue: { getToken: () => 'local-water-session' } },
        { provide: PermissionService, useValue: { require: () => {} } },
      ],
    });
  });
  afterEach(() => {
    environment.production = originalProduction;
    environment.useLocalFallback = originalFallback;
    TestBed.inject(HttpTestingController).verify();
  });
  it('ships with fallback explicitly disabled in the production environment', () => {
    expect(production.production).toBeTrue();
    expect(production.useLocalFallback).toBeFalse();
  });
  it('rejects demo sessions and offline logins in production even if fallback is enabled accidentally', () => {
    environment.production = true;
    environment.useLocalFallback = true;
    const mode = TestBed.inject(DataModeService);
    expect(mode.local).toBeFalse();
    expect(mode.canLoginLocally({ status: 0 })).toBeFalse();
  });
  it('blocks direct access to local financial data before reading browser storage or JSON', () => {
    environment.production = true;
    const read = spyOn(Storage.prototype, 'getItem').and.callThrough();
    const service = TestBed.inject(WaterLocalDataService);
    let status = 0;
    service
      .getCustomers()
      .subscribe({ next: () => fail('Demo data leaked'), error: (e) => (status = e.status) });
    expect(status).toBe(403);
    expect(read).not.toHaveBeenCalled();
    expect(service.isLocalMode$.value).toBeFalse();
    TestBed.inject(HttpTestingController).expectNone(environment.waterDataSourcePath);
  });
  it('also respects an explicit demo opt-out in development', () => {
    environment.production = false;
    environment.useLocalFallback = false;
    let status = 0;
    TestBed.inject(WaterLocalDataService)
      .login('anaAC', '123456')
      .subscribe({ next: () => fail('Demo login enabled'), error: (e) => (status = e.status) });
    expect(status).toBe(403);
  });
});
