import { Injectable } from '@angular/core';
import { AuthSessionService } from '../auth/auth-session.service';
import { environment } from '../../../environments/environments';
@Injectable({ providedIn: 'root' })
export class DataModeService {
  constructor(private session: AuthSessionService) {}
  get local(): boolean {
    return (
      !environment.production &&
      environment.useLocalFallback &&
      this.session.getToken() === 'local-water-session'
    );
  }
  canLoginLocally(error: { status?: number }): boolean {
    return !environment.production && environment.useLocalFallback && error.status === 0;
  }
}
