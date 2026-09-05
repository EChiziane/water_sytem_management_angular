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
    private http: HttpClient,
    private session: AuthSessionService,
    private localData: WaterLocalDataService
  ) {
  }

  login(login: string, password: string): Observable<User> {
    return this.http.post<{ token: string }>(`${this.baseURL}/login`, {login, password}).pipe(
      tap(response => this.session.setToken(response.token)),
      switchMap(() => this.getCurrentUser().pipe(take(1))),
      tap(user => this.session.setUser(user)),
      catchError(() => this.localData.login(login, password).pipe(
        tap(user => {
          this.session.setToken('local-water-session');
          this.session.setUser(user);
        })
      ))
    );
  }

  signup(user: SignupPayload): Observable<{ token: string }> {
    return this.http.post<{ token: string }>(`${this.baseURL}/register`, user).pipe(
      catchError(() => this.localData.addUser({...user, status: 'ACTIVE'}).pipe(
        tap(created => {
          this.session.setToken('local-water-session');
          this.session.setUser(created);
        }),
        map(() => ({token: 'local-water-session'}))
      ))
    );
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
    return this.http.get<User[]>(`${this.baseURL}/users`).pipe(
      catchError(() => this.localData.getUsers())
    );
  }

  getCurrentUser(): Observable<User> {
    return this.http.get<User>(`${this.baseURL}/me`).pipe(
      catchError(() => {
        const userId = this.session.getUser()?.id;
        return userId ? this.localData.getUserById(userId).pipe(
          switchMap(user => user ? of(user) : this.localData.getUsers().pipe(map(users => users[0])))
        ) : this.localData.getUsers().pipe(map(users => users[0]));
      })
    );
  }

  deleteUser(id: string): Observable<User> {
    return this.http.delete<User>(`${this.baseURL}/${id}`).pipe(
      take(1),
      catchError(() => this.localData.deleteUser(id))
    );
  }

  logout(): void {
    this.session.clear();
  }

  getToken(): string | null {
    return this.session.getToken();
  }
}
