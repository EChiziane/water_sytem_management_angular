import {Injectable} from '@angular/core';
import {ActivatedRouteSnapshot, CanActivate, Router} from '@angular/router';

import {AuthSessionService} from '@core/auth/auth-session.service';
import {UserRole} from '@shared/models/user';

@Injectable({
  providedIn: 'root'
})
export class RoleGuard implements CanActivate {

  constructor(
    private router: Router,
    private session: AuthSessionService
  ) {
  }

  canActivate(route: ActivatedRouteSnapshot): boolean {
    const allowedRoles = route.data['roles'] as UserRole[] | undefined;

    if (!allowedRoles?.length) {
      return true;
    }

    const currentRole = this.session.getUser()?.role;

    if (currentRole && allowedRoles.includes(currentRole)) {
      return true;
    }

    this.router.navigate(['/app/dashboard']);
    return false;
  }
}
