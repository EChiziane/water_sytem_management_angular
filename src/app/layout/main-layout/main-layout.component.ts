import {Component} from '@angular/core';
import {Router} from '@angular/router';
import {AuthSessionService} from '../../core/auth/auth-session.service';

@Component({
  selector: 'app-main-layout',
  standalone: false,
  templateUrl: './main-layout.component.html',
  styleUrl: './main-layout.component.scss'
})
export class MainLayoutComponent {
  isCollapsed = false;

  username: string = 'Utilizador';

  userInitials: string = 'UT';

  constructor(
    private router: Router,
    private session: AuthSessionService
  ) {
  }

  ngOnInit(): void {
    const user = this.session.getUser();

    if (user) {
      this.username = user.name ?? user.login ?? 'Utilizador';
      this.userInitials = this.getInitials(this.username);
    }
  }

  logout(): void {
    this.session.clear();
    this.router.navigate(['/landing-page']);
  }

  private getInitials(name: string): string {
    const initials = name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map(part => part.charAt(0).toUpperCase())
      .join('');

    return initials || 'UT';
  }
}
