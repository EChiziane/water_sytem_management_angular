import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { CompanyProfileService } from './company-profile.service';
import { AuthSessionService } from '@core/auth/auth-session.service';
import { COMPANY_PROFILE } from '@shared/config/company-profile';
import { environment } from '../../../../environments/environments';

describe('Company profile persistence', () => {
  let service: CompanyProfileService;
  let http: HttpTestingController;
  let original: string | null;
  let token = 'api-token';
  const key = `${environment.waterStorageKey}-company`;
  const url = `${environment.baseURL}/company`;
  const profile = { ...COMPANY_PROFILE, version: 2 };
  let originalMode: string;
  beforeEach(() => {
    originalMode = environment.dataMode;
    environment.dataMode = 'spring';
    token = 'api-token';
    original = localStorage.getItem(key);
    localStorage.removeItem(key);
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        {
          provide: AuthSessionService,
          useValue: {
            getUser: () => ({ id: 'operator', role: 'ADMIN', status: 'ACTIVE' }),
            getToken: () => token,
          },
        },
      ],
    });
    service = TestBed.inject(CompanyProfileService);
    http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => {
    environment.dataMode = originalMode;
    http.verify();
    if (original === null) localStorage.removeItem(key);
    else localStorage.setItem(key, original);
  });
  it('loads the API profile and saves only editable fields and the version', () => {
    service.getProfile().subscribe();
    http.expectOne(url).flush(profile);
    service.save({ ...profile, name: ' Nova Empresa ', updatedBy: 'forged' }).subscribe();
    const request = http.expectOne(url);
    expect(request.request.method).toBe('PUT');
    expect(request.request.body.name).toBe('Nova Empresa');
    expect(request.request.body.updatedBy).toBeUndefined();
    expect(request.request.body.version).toBe(2);
    request.flush({ ...profile, name: 'Nova Empresa', version: 3 });
  });
  it('never falls back to local data on authorization failures', () => {
    let status = 0;
    service.getProfile().subscribe({ error: (error) => (status = error.status) });
    http.expectOne(url).flush({}, { status: 403, statusText: 'Forbidden' });
    expect(status).toBe(403);
    expect(service.source$.value).toBe('none');
  });
  it('does not turn failed API writes into local successes', () => {
    service.getProfile().subscribe();
    http.expectOne(url).flush(profile);
    let status = 0;
    service.save(profile).subscribe({ error: (error) => (status = error.status) });
    http.expectOne(url).flush({}, { status: 503, statusText: 'Unavailable' });
    expect(status).toBe(503);
    expect(localStorage.getItem(key)).toBeNull();
    expect(service.source$.value).toBe('api');
  });
  it('persists explicitly identified demo data and records the local actor', () => {
    token = 'local-water-session';
    service.getProfile().subscribe();
    http.expectNone(url);
    expect(service.source$.value).toBe('demo');
    service
      .save({ ...COMPANY_PROFILE, name: 'Empresa de teste', version: null })
      .subscribe((saved) => {
        expect(saved.name).toBe('Empresa de teste');
        expect(saved.updatedBy).toBe('operator');
        expect(saved.version).toBe(0);
      });
    expect(JSON.parse(localStorage.getItem(key)!).name).toBe('Empresa de teste');
  });
  it('exposes only public contact fields to the landing page', () => {
    service.getPublicProfile().subscribe((publicData) => {
      expect('nuit' in publicData).toBeFalse();
      expect('updatedBy' in publicData).toBeFalse();
      expect(publicData.name).toBe(profile.name);
    });
    http.expectOne(url + '/public').flush({ ...profile, updatedBy: 'private-audit-user' });
  });
  it('rejects overwriting a newer demo version', () => {
    token = 'local-water-session';
    service.getProfile().subscribe();
    http.expectNone(url);
    localStorage.setItem(key, JSON.stringify({ ...profile, version: 3 }));
    let status = 0;
    service.save(profile).subscribe({ error: (error) => (status = error.status) });
    expect(status).toBe(409);
    expect(JSON.parse(localStorage.getItem(key)!).version).toBe(3);
  });
});
