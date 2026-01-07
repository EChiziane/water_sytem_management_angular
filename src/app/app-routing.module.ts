import {NgModule} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';
import {LoginComponent} from './UASM/login/login.component';
import {SigninComponent} from './UASM/signin/signin.component';
import {ListuserComponent} from './UASM/listuser/listuser.component';
import {CustomerDetailsComponent} from './WSM/customer/customer-details/customer-details.component';
import {PaymentDetailsComponent} from './WSM/payment/payment-details/payment-details.component';
import {PaymentComponent} from './WSM/payment/payment.component';
import {CustomerComponent} from './WSM/customer/customer.component';
import {CalendarComponent} from './calendar/calendar.component';
import {ReciboComponent} from './WSM/recibo/recibo.component';

const routes: Routes = [
  // Alterar o redirecionamento para 'login' como a rota inicial
  {path: '', pathMatch: 'full', redirectTo: '/login'},
  {path: 'login', component: LoginComponent},
  {path: 'register', component: SigninComponent},
  {path: 'users', component: ListuserComponent},
  {path: 'customer-detail/:id', component: CustomerDetailsComponent},
  {path: 'payment-detail/:id', component: PaymentDetailsComponent},
  {path: 'payment', component: PaymentComponent},
  {path: 'customer', component: CustomerComponent},
  {path: 'calendar', component: CalendarComponent},
  {path: 'recibo', component: ReciboComponent},
  {path: 'welcome', loadChildren: () => import('./pages/welcome/welcome.module').then(m => m.WelcomeModule)}
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule {
}
