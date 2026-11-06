import { of, Subject, throwError } from 'rxjs';
import { LoginComponent } from './login.component';

describe('Login entry flow', () => {
  function setup(validSession = false) {
    const auth = {
      login: jasmine.createSpy('login').and.returnValue(of({})),
      logout: jasmine.createSpy('logout'),
    };
    const router = { navigate: jasmine.createSpy('navigate') };
    const c = new LoginComponent(
      { instant: (key: string) => key } as any,
      auth as any,
      { hasValidSession: () => validSession } as any,
      { getPublicProfile: () => of({ name: 'Águas Chiziane' }) } as any,
      router as any,
      {} as any,
    );
    return { c, auth, router };
  }
  it('keeps an active session and continues to the panel', () => {
    const { c, auth, router } = setup(true);
    c.ngOnInit();
    expect(auth.logout).not.toHaveBeenCalled();
    expect(router.navigate).toHaveBeenCalledWith(['/app/dashboard']);
  });
  it('does not submit twice and clears the previous error before retrying', () => {
    const { c, auth } = setup();
    const pending = new Subject<any>();
    auth.login.and.returnValue(pending);
    c.userForm.setValue({ login: ' admin ', password: '123456' });
    c.responseMessage = 'old error';
    c.login();
    c.login();
    expect(c.responseMessage).toBeNull();
    expect(auth.login).toHaveBeenCalledOnceWith('admin', '123456');
    pending.error({ status: 503 });
    expect(c.isLoading).toBeFalse();
    expect(c.responseMessage).toBe('accountSecurity.loginUnavailable');
  });
  it('keeps the password on failure and distinguishes invalid credentials', () => {
    const { c, auth } = setup();
    auth.login.and.returnValue(throwError(() => ({ status: 401 })));
    c.userForm.setValue({ login: 'admin', password: 'wrong' });
    c.login();
    expect(c.userForm.value.password).toBe('wrong');
    expect(c.responseMessage).toBe('accountSecurity.loginInvalid');
  });
  it('does not open the HTTP recovery workflow in browser mode', () => {
    const { c } = setup();
    if (!c.browserMode) return;
    c.openForgotPasswordModal();
    expect(c.isForgotPasswordVisible).toBeFalse();
  });
});
