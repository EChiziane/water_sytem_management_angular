import { Component } from '@angular/core';
import { AuthSessionService } from '@core/auth/auth-session.service';

@Component({
  selector: 'app-root',
  standalone: false,
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent {
  constructor(private session: AuthSessionService) {}

  isAuthenticated(): boolean {
    return this.session.hasValidSession();
  }
}
