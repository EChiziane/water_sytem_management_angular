import { usesBrowserData } from '@shared/config/data-mode';
import { Injectable } from '@angular/core';
import { AuthSessionService } from '../auth/auth-session.service';
@Injectable({ providedIn: 'root' })
export class DataModeService {
  constructor(private session: AuthSessionService) {}
  get local(): boolean {
    return usesBrowserData() && this.session.getToken() === 'local-water-session';
  }
  canLoginLocally(error: { status?: number }): boolean {
    return usesBrowserData() && error.status === 0;
  }
}
