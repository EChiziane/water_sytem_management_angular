import {NgModule} from '@angular/core';
import {NzIconModule, provideNzIcons} from 'ng-zorro-antd/icon';

import {
  ArrowRightOutline,
  CarOutline,
  ClockCircleOutline,
  CustomerServiceOutline,
  DashboardOutline,
  EnvironmentOutline,
  FormOutline,
  MailOutline,
  MenuFoldOutline,
  MenuOutline,
  MenuUnfoldOutline,
  PhoneOutline,
  SafetyCertificateOutline
} from '@ant-design/icons-angular/icons';

const icons = [
  ArrowRightOutline,
  CarOutline,
  ClockCircleOutline,
  CustomerServiceOutline,
  DashboardOutline,
  EnvironmentOutline,
  FormOutline,
  MailOutline,
  MenuFoldOutline,
  MenuOutline,
  MenuUnfoldOutline,
  PhoneOutline,
  SafetyCertificateOutline
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
