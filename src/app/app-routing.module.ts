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
import {StudentComponent} from './students/students.component';
import {TeacherComponent} from './teacher/teacher.component';
import {ClassroomComponent} from './classroom/classroom.component';
import {ReciboComponent} from './recibo/recibo.component';
import {CarloadInvoiceComponent} from './CLSM/carload-invoice/carload-invoice.component';
import {CarloadCustomerComponent} from './CLSM/carload-customer/carload-customer.component';
import {CarloadCotacaoComponent} from './carload-cotacao/carload-cotacao.component';


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
  {path: 'student', component: StudentComponent},
  {path: 'teacher', component:TeacherComponent},
  {path: 'classroom', component:ClassroomComponent},
  {path: 'carload-invoice', component:CarloadInvoiceComponent},
  {path: 'carload-cotacao', component:CarloadCotacaoComponent},
  {path: 'carload-customer', component:CarloadCustomerComponent},
  {path: 'recibo', component:ReciboComponent},
  {path: 'welcome', loadChildren: () => import('./pages/welcome/welcome.module').then(m => m.WelcomeModule)}
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule {
}
