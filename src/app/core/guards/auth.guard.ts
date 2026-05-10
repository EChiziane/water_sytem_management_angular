import {CanActivate, Router} from '@angular/router';
import {Injectable} from '@angular/core';
import {AuthSessionService} from '../auth/auth-session.service';


@Injectable({providedIn: 'root'})
export class AuthGuard implements CanActivate {

    constructor(
        private router: Router,
        private session: AuthSessionService
    ) {
    }

    canActivate(): boolean {
        if (this.session.hasValidSession()) {
            return true;
        }

        this.session.clear();
        this.router.navigate(['/login']);
        return false;
    }
}
