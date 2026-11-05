import { AuthSessionService } from '@core/auth/auth-session.service';
import { Injectable } from '@angular/core';
@Injectable({ providedIn: 'root' })
export class ListViewStateService {
  private states = new Map<string, Record<string, unknown>>();
  constructor(private session: AuthSessionService) {}
  private scoped(key: string) {
    return (this.session.getUser()?.id || 'guest') + ':' + key;
  }
  read(key: string): Record<string, unknown> {
    return { ...this.states.get(this.scoped(key)) };
  }
  save(key: string, state: Record<string, unknown>) {
    this.states.set(this.scoped(key), { ...state });
  }
}
