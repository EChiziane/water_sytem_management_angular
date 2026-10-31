import {Injectable} from '@angular/core';
import {HttpErrorResponse} from '@angular/common/http';
import {AuthSessionService} from '@core/auth/auth-session.service';
import {Permission, ROLE_PERMISSIONS} from '@shared/config/permissions';
@Injectable({providedIn:'root'})
export class PermissionService {
 constructor(private session:AuthSessionService){}
 can(permission:Permission):boolean {const user=this.session.getUser();return user?.status==='ACTIVE' && !!user.role && !!ROLE_PERMISSIONS[user.role]?.includes(permission);}
 require(permission:Permission):void {if(!this.can(permission))throw new HttpErrorResponse({status:403,statusText:'Acesso não autorizado'});}
 get permissions():readonly Permission[] {const user=this.session.getUser();return user?.status==='ACTIVE' && user.role ? ROLE_PERMISSIONS[user.role] || []:[];}
}
