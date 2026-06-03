import {isPlatformBrowser} from '@angular/common';
import {Inject, Injectable, PLATFORM_ID} from '@angular/core';
import {User} from '@shared/models/user';

type StoredUser = Partial<Omit<User, 'password'>>;

@Injectable({
  providedIn: 'root'
})
export class AuthSessionService {
  private readonly tokenKey = 'token';
  private readonly userKey = 'user';

  constructor(@Inject(PLATFORM_ID) private platformId: object) {
  }

  getToken(): string | null {
    return this.read(this.tokenKey);
  }

  setToken(token: string): void {
    this.write(this.tokenKey, token);
  }

  getUser(): StoredUser | null {
    const rawUser = this.read(this.userKey);

    if (!rawUser) {
      return null;
    }

    try {
      return JSON.parse(rawUser) as StoredUser;
    } catch {
      this.clearUser();
      return null;
    }
  }

  setUser(user: User): void {
    const safeUser: StoredUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      status: user.status,
      phone: user.phone,
      login: user.login,
      role: user.role,
      createdAt: user.createdAt
    };

    this.write(this.userKey, JSON.stringify(safeUser));
  }

  hasValidSession(): boolean {
    const token = this.getToken();
    return !!token && !this.isTokenExpired(token);
  }

  clear(): void {
    this.remove(this.tokenKey);
    this.remove(this.userKey);
  }

  private clearUser(): void {
    this.remove(this.userKey);
  }

  private read(key: string): string | null {
    if (!isPlatformBrowser(this.platformId)) {
      return null;
    }

    return localStorage.getItem(key);
  }

  private write(key: string, value: string): void {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem(key, value);
    }
  }

  private remove(key: string): void {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.removeItem(key);
    }
  }

  private isTokenExpired(token: string): boolean {
    const [, payload] = token.split('.');

    if (!payload) {
      return false;
    }

    try {
      const normalizedPayload = payload.replace(/-/g, '+').replace(/_/g, '/');
      const decoded = JSON.parse(atob(normalizedPayload)) as { exp?: number };
      return !!decoded.exp && decoded.exp * 1000 <= Date.now();
    } catch {
      return false;
    }
  }
}
