import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, Router, UrlTree } from '@angular/router';
import { PermissionService } from '@core/auth/permission.service';
import { AuthSessionService } from '@core/auth/auth-session.service';
import { Permission } from '@shared/config/permissions';
@Injectable({ providedIn: 'root' })
export class PermissionGuard implements CanActivate {
  constructor(
    private permissions: PermissionService,
    private session: AuthSessionService,
    private router: Router,
  ) {}
  canActivate(route: ActivatedRouteSnapshot): boolean | UrlTree {
    if (!this.session.hasValidSession()) return this.router.createUrlTree(['/login']);
    const permission = route.data['permission'] as Permission | undefined;
    return !permission || this.permissions.can(permission)
      ? true
      : this.router.createUrlTree(['/app/access-denied']);
  }
}
