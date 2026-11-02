import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { IconsProviderModule } from '../../../core/icons/icons-provider.module';
import { PermissionService } from '@core/auth/permission.service';
import { AuthSessionService } from '@core/auth/auth-session.service';
import { WaterLocalDataService } from '@core/data/demo/water-local-data.service';
import { OperationConfirmationService } from '@core/services/dialogs/operation-confirmation.service';
import { TranslationService } from '@core/services/i18n/translation.service';
import { environment } from '../../../../environments/environments';
import { DataToolsComponent } from './data-tools.component';
describe('Backup controls', () => {
  let production: boolean, allowed: boolean, http: HttpTestingController;
  let data: jasmine.SpyObj<WaterLocalDataService>,
    confirmation: jasmine.SpyObj<OperationConfirmationService>,
    session: { clear: jasmine.Spy };
  beforeEach(async () => {
    production = environment.production;
    environment.production = false;
    allowed = true;
    data = jasmine.createSpyObj('LocalData', ['exportState', 'exportRawBackup', 'restoreBackup']);
    confirmation = jasmine.createSpyObj('Confirmations', ['run']);
    session = { clear: jasmine.createSpy() };
    await TestBed.configureTestingModule({
      imports: [DataToolsComponent, IconsProviderModule, NoopAnimationsModule],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: PermissionService, useValue: { can: () => allowed } },
        { provide: WaterLocalDataService, useValue: data },
        { provide: OperationConfirmationService, useValue: confirmation },
        { provide: AuthSessionService, useValue: session },
        { provide: TranslationService, useValue: { instant: (key: string) => key } },
        { provide: Router, useValue: { navigate: () => Promise.resolve(true) } },
      ],
    }).compileComponents();
    http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => {
    environment.production = production;
    http.verify();
  });
  it('does not show administrative backup controls to an unauthorized user', () => {
    allowed = false;
    const f = TestBed.createComponent(DataToolsComponent);
    f.detectChanges();
    expect(f.nativeElement.querySelector('button')).toBeNull();
    http.expectNone(environment.baseURL + '/backups/status');
  });
  it('does not contact the API in local mode', () => {
    const f = TestBed.createComponent(DataToolsComponent);
    f.detectChanges();
    expect(f.nativeElement.textContent).toContain('dataTools.localMode');
    http.expectNone(environment.baseURL + '/backups/status');
    expect(f.nativeElement.textContent).not.toContain('dataTools.spring');
  });
  it('waits for confirmation before replacing local data and signing out', async () => {
    const f = TestBed.createComponent(DataToolsComponent);
    f.detectChanges();
    const raw = JSON.stringify({ state: { customers: [], payments: [], receipts: [], users: [] } });
    const event = {
      target: { files: [new File([raw], 'copy.txt')], value: 'file' },
    } as unknown as Event;
    await f.componentInstance.selectFile(event);
    expect(data.restoreBackup).not.toHaveBeenCalled();
    expect(session.clear).not.toHaveBeenCalled();
    expect(confirmation.run).toHaveBeenCalled();
    await firstValueFrom(confirmation.run.calls.mostRecent().args[1]());
    expect(data.restoreBackup).toHaveBeenCalledWith(raw);
    expect(session.clear).toHaveBeenCalled();
  });
  it('rejects a malformed file without opening confirmation or touching local records', async () => {
    const f = TestBed.createComponent(DataToolsComponent);
    await f.componentInstance.selectFile({
      target: { files: [new File(['bad'], 'copy.txt')], value: 'file' },
    } as unknown as Event);
    expect(confirmation.run).not.toHaveBeenCalled();
    expect(data.restoreBackup).not.toHaveBeenCalled();
    expect(f.componentInstance.error).toBe('dataTools.invalid');
  });
  it('uses cloud controls in production and does not turn a failed Spring backup into success', async () => {
    environment.production = true;
    const f = TestBed.createComponent(DataToolsComponent);
    f.detectChanges();
    http.expectOne(environment.baseURL + '/backups/status').flush({ lastSpringBackup: null });
    expect(f.nativeElement.textContent).toContain('dataTools.cloudMode');
    expect(f.nativeElement.textContent).not.toContain('dataTools.import');
    f.componentInstance.cloudAction('spring');
    http.expectNone(environment.baseURL + '/backups/spring');
    const pending = firstValueFrom(confirmation.run.calls.mostRecent().args[1]());
    http
      .expectOne(environment.baseURL + '/backups/spring')
      .flush({ message: 'Spring indisponível' }, { status: 502, statusText: 'Bad Gateway' });
    await expectAsync(pending).toBeRejected();
    expect(f.componentInstance.error).toBe('Spring indisponível');
    expect(f.componentInstance.notice).toBe('');
    expect(data.restoreBackup).not.toHaveBeenCalled();
  });
});
