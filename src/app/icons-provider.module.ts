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
  ArrowLeftOutline,
  CheckCircleOutline,
  DeleteOutline,
  EditOutline,
  EyeOutline,
  IdcardOutline,
  LogoutOutline,
  MailOutline,
  CalendarOutline,
  MenuFoldOutline,
  MenuOutline,
  MenuUnfoldOutline,
  PhoneOutline,
  ReloadOutline,
  SafetyCertificateOutline,
  SearchOutline,
  SettingOutline,
  TeamOutline,
  UnorderedListOutline,
  UserAddOutline,
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
  ArrowLeftOutline,
  CheckCircleOutline,
  DeleteOutline,
  EditOutline,
  EyeOutline,
  IdcardOutline,
  LogoutOutline,
  MailOutline,
  MenuFoldOutline,
  MenuOutline,
  MenuUnfoldOutline,
  PhoneOutline,
  ReloadOutline,
  SafetyCertificateOutline,
  SearchOutline,
  SettingOutline,
  TeamOutline,
  UnorderedListOutline,
  UserAddOutline,
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
