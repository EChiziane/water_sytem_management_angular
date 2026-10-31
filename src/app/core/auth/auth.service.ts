import {DataModeService} from './data-mode.service';
import {DataAccessService} from './data-access.service';
import {throwError} from 'rxjs';
import {Injectable} from '@angular/core';
import {environment} from '../../../environments/environments';
import {HttpClient} from '@angular/common/http';
import {Observable, catchError, map, of, switchMap, take, tap} from 'rxjs';
import {User} from '@shared/models/user';
import {AuthSessionService} from '@core/auth/auth-session.service';
import {WaterLocalDataService} from '@core/services/water-local-data.service';

type SignupPayload = Pick<User, 'name' | 'email' | 'phone' | 'login' | 'password' | 'role'>;

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private baseURL = environment.baseURL + '/auth';

  constructor(
    private mode: DataModeService,
    private access: DataAccessService,
    private http: HttpClient,
    private session: AuthSessionService,
    private localData: WaterLocalDataService
  ) {
  }

  login(login: string, password: string): Observable<User> {
    this.session.clear();
    return this.http.post<{ token: string }>(`${this.baseURL}/login`, {login, password}).pipe(
      catchError(error => this.mode.canLoginLocally(error) ? this.localData.login(login, password).pipe(
        map(user => ({token: 'local-water-session', user}))
      ) : throwError(() => error)),
      switchMap(response => {
        this.session.setToken(response.token);
        this.localData.isLocalMode$.next(response.token === 'local-water-session');
        return 'user' in response ? of(response.user) : this.http.get<User>(`${this.baseURL}/me`);
      }),
      tap(user => this.session.setUser(user))
    );
  }

  signup(user: SignupPayload): Observable<{ token: string }> {
    return this.access.denied();
  }

  requestPasswordReset(phoneWhatsApp: string): Observable<{
    maskedName: string;
    maskedEmail: string;
    maskedPhone: string
  }> {
    return this.http.post<{ maskedName: string; maskedEmail: string; maskedPhone: string }>(
      `${this.baseURL}/password/reset/request`,
      {phoneWhatsApp}
    ).pipe(take(1));
  }

  confirmPasswordReset(phoneWhatsApp: string): Observable<{ ok: boolean }> {
    return this.http.post<{ ok: boolean }>(`${this.baseURL}/password/reset/confirm`, {phoneWhatsApp}).pipe(take(1));
  }

  resetPassword(phoneWhatsApp: string, otpCode: string, newPassword: string): Observable<{ ok: boolean }> {
    return this.http.post<{ ok: boolean }>(
      `${this.baseURL}/password/reset`,
      {phoneWhatsApp, otpCode, newPassword}
    ).pipe(take(1));
  }

  getUsers(): Observable<User[]> {
    return this.access.run('users.manage', () => this.http.get<User[]>(`${this.baseURL}/users`), () => this.localData.getUsers());
  }

  getCurrentUser(): Observable<User> {
    if(this.mode.local){
      const id=this.session.getUser()?.id;
      return this.localData.getUserById(id || '').pipe(switchMap(user => user?.status==='ACTIVE' ? of(user) : throwError(() => new Error('Conta inativa ou inexistente'))));
    }
    return this.http.get<User>(`${this.baseURL}/me`);
  }

  deleteUser(id:string): Observable<User> {
    return this.access.run('users.manage', () => this.http.delete<User>(`${this.baseURL}/${id}`), () => this.localData.deleteUser(id));
  }

  logout(): void {
    this.session.clear();
  }

  getToken(): string | null {
    return this.session.getToken();
  }
}
