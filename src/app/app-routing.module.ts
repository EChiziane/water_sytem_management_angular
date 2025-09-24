import {NgModule} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';

import {LoginComponent} from './UASM/login/login.component';
import {SigninComponent} from './UASM/signin/signin.component';
import {ListuserComponent} from './UASM/listuser/listuser.component';

import {CarloadComponent} from './CLSM/carload/carload.component';
import {ManagerComponent} from './CLSM/manager/manager.component';

import {DriverComponent} from './CLSM/driver/driver.component';
import {CustomerDetailsComponent} from './CLSM/customer/customer-details/customer-details.component';
import {PaymentDetailsComponent} from './WSM/payment/payment-details/payment-details.component';
import {PaymentComponent} from './WSM/payment/payment.component';
import {CustomerComponent} from './CLSM/customer/customer.component';
import {SprintComponent} from './CLSM/sprint/sprint.component';
import {SprintDetailsComponent} from './CLSM/sprint/sprint-details/sprint-details.component';
import {CalendarComponent} from './calendar/calendar.component';
import {InvoiceComponent} from './invoice/invoice.component';
import {CarloadInvoiceComponent} from './carload-invoice/carload-invoice.component';


const routes: Routes = [
  // Alterar o redirecionamento para 'login' como a rota inicial
  {path: '', pathMatch: 'full', redirectTo: '/login'},
  {path: 'carload', component: CarloadComponent},
  {path: 'login', component: LoginComponent},
  {path: 'register', component: SigninComponent},
  {path: 'users', component: ListuserComponent},
  {path: 'customer-detail/:id', component: CustomerDetailsComponent},
  {path: 'payment-detail/:id', component: PaymentDetailsComponent},
  {path: 'payment', component: PaymentComponent},
  {path: 'customer', component: CustomerComponent},
  {path: 'manager', component: ManagerComponent},
  {path: 'sprint', component: SprintComponent},
  {path: 'sprint-detail/:id', component: SprintDetailsComponent},
  {path: 'driver', component: DriverComponent},
  {path: 'calendar', component: CalendarComponent},
  {path: 'invoice', component: CarloadInvoiceComponent},
  {path: 'welcome', loadChildren: () => import('./pages/welcome/welcome.module').then(m => m.WelcomeModule)}
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule {
}
