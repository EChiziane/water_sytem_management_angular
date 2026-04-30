import {Component} from '@angular/core';
import {Router} from '@angular/router';
import {User} from '../models/user';

@Component({
  selector: 'app-main-layout',
  standalone: false,
  templateUrl: './main-layout.component.html',
  styleUrl: './main-layout.component.scss'
})
export class MainLayoutComponent {
  isCollapsed = false;

  username: string = 'Utilizador';

  constructor(private router: Router) {
  }

  ngOnInit(): void {
    const userJson = localStorage.getItem('user');
    if (!userJson) return;

    try {
      const user = JSON.parse(userJson) as Partial<User>;
      this.username = user.name ?? user.login ?? 'Utilizador';
    } catch {
      this.username = 'Utilizador';
    }
  }

  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    this.router.navigate(['/landing-page']);
  }
}
