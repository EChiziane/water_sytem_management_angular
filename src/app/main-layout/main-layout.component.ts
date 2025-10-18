import {Component} from '@angular/core';

@Component({
  selector: 'app-main-layout',
  standalone: false,
  templateUrl: './main-layout.component.html',
  styleUrl: './main-layout.component.scss'
})
export class MainLayoutComponent {
  isCollapsed = false;
  username?: string|null ; // default caso não haja user

  ngOnInit(): void {
    // Supondo que guardaste os dados do user em localStorage
    const userJson = localStorage.getItem('user');


      this.username = userJson;
      console.log(userJson)// pega o nome do user

  }

  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }
}
