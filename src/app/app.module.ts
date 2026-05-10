import {registerLocaleData} from '@angular/common';
import en from '@angular/common/locales/en';
import {HTTP_INTERCEPTORS, provideHttpClient, withFetch, withInterceptorsFromDi} from '@angular/common/http';
import {NgModule} from '@angular/core';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {MatButton} from '@angular/material/button';
import {MatDatepicker, MatDatepickerInput, MatDatepickerToggle} from '@angular/material/datepicker';
import {MatFormField, MatLabel} from '@angular/material/form-field';
import {MatInput} from '@angular/material/input';
import {MatOption, MatSelect} from '@angular/material/select';
import {BrowserModule, provideClientHydration, withEventReplay} from '@angular/platform-browser';
import {provideAnimationsAsync} from '@angular/platform-browser/animations/async';
import {NzAlertComponent} from 'ng-zorro-antd/alert';
import {NzAvatarModule} from 'ng-zorro-antd/avatar';
import {NzBreadCrumbComponent, NzBreadCrumbItemComponent} from 'ng-zorro-antd/breadcrumb';
import {NzButtonComponent, NzButtonModule} from 'ng-zorro-antd/button';
import {NzCalendarComponent} from 'ng-zorro-antd/calendar';
import {NzCardComponent} from 'ng-zorro-antd/card';
import {NzCarouselComponent, NzCarouselContentDirective} from 'ng-zorro-antd/carousel';
import {NzCheckboxComponent} from 'ng-zorro-antd/checkbox';
import {NzDatePickerComponent, NzDatePickerModule, NzRangePickerComponent} from 'ng-zorro-antd/date-picker';
import {NzDescriptionsComponent, NzDescriptionsItemComponent} from 'ng-zorro-antd/descriptions';
import {NzDividerComponent} from 'ng-zorro-antd/divider';
import {NzDrawerComponent, NzDrawerContentDirective, NzDrawerModule} from 'ng-zorro-antd/drawer';
import {NzDropDownModule} from 'ng-zorro-antd/dropdown';
import {NzEmptyComponent} from 'ng-zorro-antd/empty';
import {NzFormModule} from 'ng-zorro-antd/form';
import {NzColDirective, NzRowDirective} from 'ng-zorro-antd/grid';
import {en_US, provideNzI18n} from 'ng-zorro-antd/i18n';
import {NzAutosizeDirective, NzInputDirective, NzInputGroupComponent, NzInputModule} from 'ng-zorro-antd/input';
import {NzLayoutModule} from 'ng-zorro-antd/layout';
import {NzMenuModule} from 'ng-zorro-antd/menu';
import {NzModalModule} from 'ng-zorro-antd/modal';
import {NzPageHeaderComponent, NzPageHeaderContentDirective} from 'ng-zorro-antd/page-header';
import {NzSelectComponent, NzSelectModule} from 'ng-zorro-antd/select';
import {NzSpaceComponent, NzSpaceItemDirective} from 'ng-zorro-antd/space';
import {NzSpinComponent} from 'ng-zorro-antd/spin';
import {NzStatisticComponent} from 'ng-zorro-antd/statistic';
import {NzSwitchComponent, NzSwitchModule} from 'ng-zorro-antd/switch';
import {NzTableModule, NzFilterTriggerComponent, NzThAddOnComponent} from 'ng-zorro-antd/table';
import {NzTagComponent} from 'ng-zorro-antd/tag';
import {NzTooltipDirective} from 'ng-zorro-antd/tooltip';

import {AppRoutingModule} from './app-routing.module';
import {AppComponent} from './app.component';
import {CalendarComponent} from './features/calendar/calendar.component';
import {IconsProviderModule} from './icons-provider.module';
import {AuthInterceptor} from './core/interceptors/auth-interceptor';
import {LandingPageComponent} from './pages/landing/landingpage.component';
import {MainLayoutComponent} from './layout/main-layout/main-layout.component';
import {ListuserComponent} from './features/users/list-user/listuser.component';
import {LoginComponent} from './pages/auth/login/login.component';
import {SigninComponent} from './pages/auth/sign-up/signin.component';
import {CustomerDetailsComponent} from './features/customers/customer-details/customer-details.component';
import {CustomerComponent} from './features/customers/customer.component';
import {DashboardComponent} from './features/dashboard/dashboard.component';
import {MonthlyChargeComponent} from './features/billing/monthly-charge/monthly-charge.component';
import {PaymentDetailsComponent} from './features/payments/payment-details/payment-details.component';
import {PaymentComponent} from './features/payments/payment.component';
import {ReciboComponent} from './features/receipts/recibo.component';

registerLocaleData(en);

@NgModule({
  declarations: [
    AppComponent,
    CalendarComponent,
    CustomerComponent,
    CustomerDetailsComponent,
    DashboardComponent,
    LandingPageComponent,
    ListuserComponent,
    LoginComponent,
    MainLayoutComponent,
    MonthlyChargeComponent,
    PaymentComponent,
    PaymentDetailsComponent,
    ReciboComponent,
    SigninComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    IconsProviderModule,
    FormsModule,
    ReactiveFormsModule,

    NzAlertComponent,
    NzAutosizeDirective,
    NzAvatarModule,
    NzBreadCrumbComponent,
    NzBreadCrumbItemComponent,
    NzButtonComponent,
    NzButtonModule,
    NzCalendarComponent,
    NzCardComponent,
    NzCarouselComponent,
    NzCarouselContentDirective,
    NzCheckboxComponent,
    NzColDirective,
    NzDatePickerComponent,
    NzDatePickerModule,
    NzDescriptionsComponent,
    NzDescriptionsItemComponent,
    NzDividerComponent,
    NzDrawerComponent,
    NzDrawerContentDirective,
    NzDrawerModule,
    NzDropDownModule,
    NzEmptyComponent,
    NzFilterTriggerComponent,
    NzFormModule,
    NzInputDirective,
    NzInputGroupComponent,
    NzInputModule,
    NzLayoutModule,
    NzMenuModule,
    NzModalModule,
    NzPageHeaderComponent,
    NzPageHeaderContentDirective,
    NzRangePickerComponent,
    NzRowDirective,
    NzSelectComponent,
    NzSelectModule,
    NzSpaceComponent,
    NzSpaceItemDirective,
    NzSpinComponent,
    NzStatisticComponent,
    NzSwitchComponent,
    NzSwitchModule,
    NzTableModule,
    NzTagComponent,
    NzThAddOnComponent,
    NzTooltipDirective,

    MatButton,
    MatDatepicker,
    MatDatepickerInput,
    MatDatepickerToggle,
    MatFormField,
    MatInput,
    MatLabel,
    MatOption,
    MatSelect
  ],
  providers: [
    {
      provide: HTTP_INTERCEPTORS,
      useClass: AuthInterceptor,
      multi: true
    },
    provideClientHydration(withEventReplay()),
    provideNzI18n(en_US),
    provideAnimationsAsync(),
    provideHttpClient(withFetch(), withInterceptorsFromDi())
  ],
  bootstrap: [AppComponent]
})
export class AppModule {
}
