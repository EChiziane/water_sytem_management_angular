import {PermissionGuard} from '@core/guards/permission.guard';
import {AccessDeniedComponent} from './features/auth/access-denied.component';
import {CompanyComponent} from './features/company/company.component';
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { AuthGuard } from '@core/guards/auth.guard';
import { CalendarComponent } from './features/calendar/calendar.component';
import { CustomerDetailsComponent } from './features/customers/customer-details/customer-details.component';
import { CustomerComponent } from './features/customers/customer.component';
import { DashboardComponent } from './features/dashboard/dashboard.component';
import { PaymentDetailsComponent } from './features/payments/payment-details/payment-details.component';
import { PaymentComponent } from './features/payments/payment.component';
import { ProfileComponent } from './features/profile/profile.component';
import { ReciboComponent } from './features/receipts/recibo.component';
import { ListuserComponent } from './features/users/list-user/listuser.component';
import { MainLayoutComponent } from '@features/shell/main-layout/main-layout.component';
import { LoginComponent } from './features/auth/login/login.component';
import { LandingPageComponent } from './features/public/landing-page/landingpage.component';

const routes: Routes = [
  {
    path: '',
    redirectTo: 'landing-page',
    pathMatch: 'full'
  },
  {
    path: 'landing-page',
    component: LandingPageComponent
  },
  {
    path: 'login',
    component: LoginComponent
  },
  {
    path: 'register',
    redirectTo: 'login', pathMatch: 'full'
  },
  {
    path: 'app',
    component: MainLayoutComponent,
    canActivate: [AuthGuard],
    children: [
      {path: 'access-denied', component: AccessDeniedComponent},
      {
        path: 'dashboard',
        component: DashboardComponent, canActivate: [PermissionGuard], data: {permission: 'dashboard.read'}
      },
      {
        path: 'customer',
        component: CustomerComponent, canActivate: [PermissionGuard], data: {permission: 'customers.read'}
      },
      {
        path: 'customer-detail/:id',
        component: CustomerDetailsComponent, canActivate: [PermissionGuard], data: {permission: 'customers.read'}
      },
      {
        path: 'payment',
        component: PaymentComponent, canActivate: [PermissionGuard], data: {permission: 'payments.read'}
      },
      {
        path: 'receipts',
        component: ReciboComponent, canActivate: [PermissionGuard], data: {permission: 'documents.issue'}
      },
      {
        path: 'payment-detail/:id',
        component: PaymentDetailsComponent, canActivate: [PermissionGuard], data: {permission: 'payments.read'}
      },
      {
        path: 'calendar',
        component: CalendarComponent, canActivate: [PermissionGuard], data: {permission: 'calendar.read'}
      },
      {
        path: 'users',
        component: ListuserComponent,
        canActivate: [PermissionGuard],
        data: {
          permission: 'users.manage'
        }
      },
      {
        path: 'company',
        component: CompanyComponent, canActivate: [PermissionGuard], data: {permission: 'company.manage'}
      },
      {
        path: 'profile',
        component: ProfileComponent, canActivate: [PermissionGuard], data: {permission: 'profile.read'}
      },
      {
        path: 'profile/:id',
        component: ProfileComponent, canActivate: [PermissionGuard], data: {permission: 'users.manage'}
      },
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
      }
    ]
  },
  {
    path: '**',
    redirectTo: 'landing-page'
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule {
}
