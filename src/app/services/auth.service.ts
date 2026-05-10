import {Injectable} from '@angular/core';
import {environment} from '../../environments/environments';
import {HttpClient} from '@angular/common/http';
import {map, Observable, switchMap, take, tap} from 'rxjs';
import {User} from '../models/user';
import {AuthSessionService} from './auth-session.service';

type SignupPayload = Pick<User, 'name' | 'email' | 'phone' | 'login' | 'password' | 'role'>;

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private baseURL = environment.baseURL + '/auth';

  constructor(
    private http: HttpClient,
    private session: AuthSessionService
  ) {
  }

  login(login: string, password: string): Observable<User> {
    return this.http.post<{ token: string }>(`${this.baseURL}/login`, {login, password}).pipe(
      tap(response => this.session.setToken(response.token)),
      switchMap(() => this.getUsers().pipe(take(1))),
      map((users: User[]) => {
        const found = users.find(user => user.login?.toLowerCase() === login.toLowerCase());

        if (!found) {
          throw new Error(`Utilizador não encontrado na lista /auth/users para o login: ${login}`);
        }

        return found;
      }),
      tap(user => this.session.setUser(user))
    );
  }

  signup(user: SignupPayload): Observable<{ token: string }> {
    return this.http.post<{ token: string }>(`${this.baseURL}/register`, user);
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
    return this.http.get<User[]>(`${this.baseURL}/users`);
  }

  deleteUser(id: string): Observable<User> {
    return this.http.delete<User>(`${this.baseURL}/${id}`).pipe(take(1));
  }

  logout(): void {
    this.session.clear();
  }

  getToken(): string | null {
    return this.session.getToken();
  }
}
