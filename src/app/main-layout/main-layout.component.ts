import {Component} from '@angular/core';
import {Router} from '@angular/router';
import {AuthSessionService} from '../services/auth-session.service';

@Component({
  selector: 'app-main-layout',
  standalone: false,
  templateUrl: './main-layout.component.html',
  styleUrl: './main-layout.component.scss'
})
export class MainLayoutComponent {
  isCollapsed = false;

  username: string = 'Utilizador';

  constructor(
    private router: Router,
    private session: AuthSessionService
  ) {
  }

  ngOnInit(): void {
    const user = this.session.getUser();

    if (user) {
      this.username = user.name ?? user.login ?? 'Utilizador';
    }
  }

  logout(): void {
    this.session.clear();
    this.router.navigate(['/landing-page']);
  }
}
