import { Component } from '@angular/core';
@Component({
  selector: 'app-access-denied',
  standalone: false,
  template: `<section>
    <h1>{{ 'access.deniedTitle' | translate }}</h1>
    <p>{{ 'access.deniedText' | translate }}</p>
    <a routerLink="/app/dashboard">{{ 'access.back' | translate }}</a>
  </section>`,
})
export class AccessDeniedComponent {}
