import {NgModule} from '@angular/core';
import {NzIconModule, provideNzIcons} from 'ng-zorro-antd/icon';

import {
  ArrowRightOutline,
  CarOutline,
  ClockCircleOutline,
  CreditCardOutline,
  CustomerServiceOutline,
  DashboardOutline,
  DownOutline,
  EnvironmentOutline,
  FileDoneOutline,
  FormOutline,
  LogoutOutline,
  MailOutline,
  CalendarOutline,
  MenuFoldOutline,
  MenuOutline,
  MenuUnfoldOutline,
  PhoneOutline,
  ReloadOutline,
  SafetyCertificateOutline,
  SettingOutline,
  TeamOutline,
  UserOutline,
  UsergroupAddOutline
} from '@ant-design/icons-angular/icons';

const icons = [
  ArrowRightOutline,
  CarOutline,
  ClockCircleOutline,
  CalendarOutline,
  CreditCardOutline,
  CustomerServiceOutline,
  DashboardOutline,
  DownOutline,
  EnvironmentOutline,
  FileDoneOutline,
  FormOutline,
  LogoutOutline,
  MailOutline,
  MenuFoldOutline,
  MenuOutline,
  MenuUnfoldOutline,
  PhoneOutline,
  ReloadOutline,
  SafetyCertificateOutline,
  SettingOutline,
  TeamOutline,
  UserOutline,
  UsergroupAddOutline
];

@NgModule({
  imports: [NzIconModule],
  exports: [NzIconModule],
  providers: [
    provideNzIcons(icons)
  ]
})
export class IconsProviderModule {
}
