import { unsavedChangesGuard } from '@core/services/dialogs/unsaved-changes.service';
import { PermissionGuard } from '@core/guards/permission.guard';
import { AccessDeniedComponent } from './features/auth/access-denied.component';
import { CompanyComponent } from './features/company/company.component';
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { AuthGuard } from '@core/guards/auth.guard';
import { CustomerDetailsComponent } from './features/customers/customer-details/customer-details.component';
import { CustomerComponent } from './features/customers/customer.component';
import { DashboardComponent } from './features/dashboard/dashboard.component';
import { PaymentDetailsComponent } from './features/payments/payment-details/payment-details.component';
import { PaymentComponent } from './features/payments/payment.component';
import { ProfileComponent } from './features/profile/profile.component';
import { ReciboComponent } from './features/receipts/receipt.component';
import { ListuserComponent } from './features/users/list-user/list-user.component';
import { MainLayoutComponent } from '@features/shell/main-layout/main-layout.component';
import { LoginComponent } from './features/auth/login/login.component';
import { LandingPageComponent } from './features/public/landing-page/landing-page.component';

import { DebtsComponent } from './features/debts/debts.component';
const routes: Routes = [
  {
    path: '',
    redirectTo: 'landing-page',
    pathMatch: 'full',
  },
  {
    path: 'landing-page',
    component: LandingPageComponent,
  },
  {
    path: 'login',
    component: LoginComponent,
  },
  {
    path: 'register',
    redirectTo: 'login',
    pathMatch: 'full',
  },
  {
    path: 'app',
    component: MainLayoutComponent,
    canActivate: [AuthGuard],
    canDeactivate: [unsavedChangesGuard],
    children: [
      { path: 'access-denied', component: AccessDeniedComponent },
      {
        path: 'dashboard',
        component: DashboardComponent,
        canActivate: [PermissionGuard],
        canDeactivate: [unsavedChangesGuard],
        data: { permission: 'dashboard.read' },
      },
      {
        path: 'customer',
        component: CustomerComponent,
        canActivate: [PermissionGuard],
        canDeactivate: [unsavedChangesGuard],
        data: { permission: 'customers.read' },
      },
      {
        path: 'customer-detail/:id',
        component: CustomerDetailsComponent,
        canActivate: [PermissionGuard],
        canDeactivate: [unsavedChangesGuard],
        data: { permission: 'customers.read' },
      },
      {
        path: 'debts',
        component: DebtsComponent,
        canActivate: [PermissionGuard],
        canDeactivate: [unsavedChangesGuard],
        data: { permission: 'reports.financial' },
      },
      {
        path: 'payment',
        component: PaymentComponent,
        canActivate: [PermissionGuard],
        canDeactivate: [unsavedChangesGuard],
        data: { permission: 'payments.read' },
      },
      {
        path: 'receipts',
        component: ReciboComponent,
        canActivate: [PermissionGuard],
        canDeactivate: [unsavedChangesGuard],
        data: { permission: 'documents.issue' },
      },
      {
        path: 'payment-detail/:id',
        component: PaymentDetailsComponent,
        canActivate: [PermissionGuard],
        canDeactivate: [unsavedChangesGuard],
        data: { permission: 'payments.read' },
      },
      {
        path: 'users',
        component: ListuserComponent,
        canActivate: [PermissionGuard],
        canDeactivate: [unsavedChangesGuard],
        data: {
          permission: 'users.manage',
        },
      },
      {
        path: 'company',
        component: CompanyComponent,
        canActivate: [PermissionGuard],
        canDeactivate: [unsavedChangesGuard],
        data: { permission: 'company.manage' },
      },
      {
        path: 'profile',
        component: ProfileComponent,
        canActivate: [PermissionGuard],
        canDeactivate: [unsavedChangesGuard],
        data: { permission: 'profile.read' },
      },
      {
        path: 'profile/:id',
        component: ProfileComponent,
        canActivate: [PermissionGuard],
        canDeactivate: [unsavedChangesGuard],
        data: { permission: 'users.manage' },
      },
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full',
      },
    ],
  },
  {
    path: '**',
    redirectTo: 'landing-page',
  },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
