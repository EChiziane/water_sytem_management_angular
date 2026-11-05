import { ProtectChangesDirective } from './shared/directives/protect-changes.directive';
import { RequestStateComponent } from './shared/components/request-state/request-state.component';
import { DataToolsComponent } from './features/company/data-tools/data-tools.component';
import { BusinessDatePipe } from './shared/pipes/business-date.pipe';
import { InfoTagComponent } from './shared/components/info-tag/info-tag.component';
import { YearFilterComponent } from '@shared/components/year-filter/year-filter.component';
import { StatusBadgeComponent } from '@shared/components/status-badge/status-badge.component';
import { RowActionComponent } from '@shared/components/row-action/row-action.component';
import { AccessDeniedComponent } from './features/auth/access-denied.component';
import { registerLocaleData } from '@angular/common';
import en from '@angular/common/locales/en';
import {
  HTTP_INTERCEPTORS,
  provideHttpClient,
  withFetch,
  withInterceptorsFromDi,
} from '@angular/common/http';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { BrowserModule, provideClientHydration, withEventReplay } from '@angular/platform-browser';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { NzAlertComponent } from 'ng-zorro-antd/alert';
import { NzAvatarModule } from 'ng-zorro-antd/avatar';
import { NzBreadCrumbComponent, NzBreadCrumbItemComponent } from 'ng-zorro-antd/breadcrumb';
import { NzButtonComponent, NzButtonModule } from 'ng-zorro-antd/button';
import { NzCardComponent } from 'ng-zorro-antd/card';
import { NzCarouselComponent, NzCarouselContentDirective } from 'ng-zorro-antd/carousel';
import { NzCheckboxComponent } from 'ng-zorro-antd/checkbox';
import {
  NzDatePickerComponent,
  NzDatePickerModule,
  NzRangePickerComponent,
} from 'ng-zorro-antd/date-picker';
import { NzDescriptionsComponent, NzDescriptionsItemComponent } from 'ng-zorro-antd/descriptions';
import { NzDividerComponent } from 'ng-zorro-antd/divider';
import { NzDrawerComponent, NzDrawerContentDirective, NzDrawerModule } from 'ng-zorro-antd/drawer';
import { NzDropDownModule } from 'ng-zorro-antd/dropdown';
import { NzEmptyComponent } from 'ng-zorro-antd/empty';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzColDirective, NzRowDirective } from 'ng-zorro-antd/grid';
import { en_US, provideNzI18n } from 'ng-zorro-antd/i18n';
import {
  NzAutosizeDirective,
  NzInputDirective,
  NzInputGroupComponent,
  NzInputModule,
} from 'ng-zorro-antd/input';
import { NzLayoutModule } from 'ng-zorro-antd/layout';
import { NzMenuModule } from 'ng-zorro-antd/menu';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { NzPageHeaderComponent, NzPageHeaderContentDirective } from 'ng-zorro-antd/page-header';
import { NzSelectComponent, NzSelectModule } from 'ng-zorro-antd/select';
import { NzSpaceComponent, NzSpaceItemDirective } from 'ng-zorro-antd/space';
import { NzSpinComponent } from 'ng-zorro-antd/spin';
import { NzStatisticComponent } from 'ng-zorro-antd/statistic';
import { NzSwitchComponent, NzSwitchModule } from 'ng-zorro-antd/switch';
import { NzTableModule, NzFilterTriggerComponent, NzThAddOnComponent } from 'ng-zorro-antd/table';
import { NzTagComponent } from 'ng-zorro-antd/tag';
import { NzTooltipDirective } from 'ng-zorro-antd/tooltip';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { IconsProviderModule } from './core/icons/icons-provider.module';
import { AuthInterceptor } from '@core/interceptors/auth-interceptor';
import { LandingPageComponent } from './features/public/landing-page/landing-page.component';
import { MainLayoutComponent } from '@features/shell/main-layout/main-layout.component';
import { ListuserComponent } from './features/users/list-user/list-user.component';
import { LoginComponent } from './features/auth/login/login.component';
import { SigninComponent } from './features/auth/register/sign-in.component';
import { CustomerDetailsComponent } from './features/customers/customer-details/customer-details.component';
import { CustomerComponent } from './features/customers/customer.component';
import { DashboardComponent } from './features/dashboard/dashboard.component';
import { PaymentDetailsComponent } from './features/payments/payment-details/payment-details.component';
import { PaymentComponent } from './features/payments/payment.component';
import { CompanyComponent } from './features/company/company.component';
import { ProfileComponent } from './features/profile/profile.component';
import { ReciboComponent } from './features/receipts/receipt.component';
import { TranslatePipe } from '@shared/pipes/translate.pipe';

import { DebtsComponent } from './features/debts/debts.component';
import { PeriodFilterComponent } from './shared/components/period-filter/period-filter.component';
registerLocaleData(en);

@NgModule({
  declarations: [
    AccessDeniedComponent,
    AppComponent,
    CustomerComponent,
    CustomerDetailsComponent,
    DashboardComponent,
    LandingPageComponent,
    ListuserComponent,
    LoginComponent,
    MainLayoutComponent,
    PaymentComponent,
    PaymentDetailsComponent,
    ProfileComponent,
    CompanyComponent,
    ReciboComponent,
    TranslatePipe,
    SigninComponent,
  ],
  imports: [
    DebtsComponent,
    PeriodFilterComponent,
    ProtectChangesDirective,
    RequestStateComponent,
    DataToolsComponent,
    BusinessDatePipe,
    InfoTagComponent,
    StatusBadgeComponent,
    YearFilterComponent,
    RowActionComponent,
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
  ],
  providers: [
    {
      provide: HTTP_INTERCEPTORS,
      useClass: AuthInterceptor,
      multi: true,
    },
    provideClientHydration(withEventReplay()),
    provideNzI18n(en_US),
    provideAnimationsAsync(),
    provideHttpClient(withFetch(), withInterceptorsFromDi()),
  ],
  bootstrap: [AppComponent],
})
export class AppModule {}
