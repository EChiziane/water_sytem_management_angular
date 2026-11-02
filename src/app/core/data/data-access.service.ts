import { Injectable } from '@angular/core';
import { defer, Observable } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';
import { DataModeService } from './data-mode.service';
import { PermissionService } from '../auth/permission.service';
import { Permission } from '@shared/config/permissions';

@Injectable({ providedIn: 'root' })
export class DataAccessService {
  constructor(
    private mode: DataModeService,
    private permissions: PermissionService,
  ) {}

  run<T>(
    permission: Permission,
    api: () => Observable<T>,
    demo: () => Observable<T>,
  ): Observable<T> {
    return defer(() => {
      this.permissions.require(permission);
      return this.mode.local ? demo() : api();
    });
  }

  denied<T>(): Observable<T> {
    return defer(() => {
      throw new HttpErrorResponse({
        status: 403,
        statusText: 'Operação indisponível: preserve o histórico.',
      });
    });
  }
}
