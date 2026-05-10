import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { AuthGuard } from './core/guards/auth.guard';
import { CalendarComponent } from './features/calendar/calendar.component';
import { CustomerDetailsComponent } from './features/customers/customer-details/customer-details.component';
import { CustomerComponent } from './features/customers/customer.component';
import { MonthlyChargeComponent } from './features/billing/monthly-charge/monthly-charge.component';
import { PaymentDetailsComponent } from './features/payments/payment-details/payment-details.component';
import { PaymentComponent } from './features/payments/payment.component';
import { ReciboComponent } from './features/receipts/recibo.component';
import { ListuserComponent } from './features/users/list-user/listuser.component';
import { MainLayoutComponent } from './layout/main-layout/main-layout.component';
import { LoginComponent } from './pages/auth/login/login.component';
import { SigninComponent } from './pages/auth/sign-up/signin.component';
import { LandingPageComponent } from './pages/landing/landingpage.component';

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
    component: SigninComponent
  },
  {
    path: 'app',
    component: MainLayoutComponent,
    canActivate: [AuthGuard],
    children: [
      {
        path: 'customer',
        component: CustomerComponent
      },
      {
        path: 'customer-detail/:id',
        component: CustomerDetailsComponent
      },
      {
        path: 'payment',
        component: PaymentComponent
      },
      {
        path: 'payment-detail/:id',
        component: PaymentDetailsComponent
      },
      {
        path: 'calendar',
        component: CalendarComponent
      },
      {
        path: 'monthly',
        component: MonthlyChargeComponent
      },
      {
        path: 'recibo',
        component: ReciboComponent
      },
      {
        path: 'users',
        component: ListuserComponent
      },
      {
        path: '',
        redirectTo: 'customer',
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
