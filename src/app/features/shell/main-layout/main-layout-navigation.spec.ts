import { UnsavedChangesService } from '@core/services/dialogs/unsaved-changes.service';
import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { Router, RouterModule, provideRouter } from '@angular/router';
import { OverlayContainer } from '@angular/cdk/overlay';
import { NzLayoutModule } from 'ng-zorro-antd/layout';
import { NzMenuModule } from 'ng-zorro-antd/menu';
import { NzDrawerModule } from 'ng-zorro-antd/drawer';
import { NzDropDownModule } from 'ng-zorro-antd/dropdown';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzTooltipDirective } from 'ng-zorro-antd/tooltip';
import { BehaviorSubject, of } from 'rxjs';
import { AuthSessionService } from '@core/auth/auth-session.service';
import { DataModeService } from '@core/data/data-mode.service';
import { TranslationService } from '@core/services/i18n/translation.service';
import { TranslatePipe } from '@shared/pipes/translate.pipe';
import { UserRole } from '@shared/models/user';
import { IconsProviderModule } from '../../../core/icons/icons-provider.module';
import { MainLayoutComponent } from './main-layout.component';

@Component({ standalone: true, template: '' })
class DestinationComponent {}

describe('Grouped application navigation', () => {
  let fixture: ComponentFixture<MainLayoutComponent>;
  let role: UserRole;
  let demo: BehaviorSubject<boolean>;
  const links = (element: ParentNode) =>
    Array.from(element.querySelectorAll('a')).map((link) => link.getAttribute('href'));
  beforeEach(async () => {
    role = 'ADMIN';
    demo = new BehaviorSubject(false);
    await TestBed.configureTestingModule({
      declarations: [MainLayoutComponent, TranslatePipe],
      imports: [
        CommonModule,
        RouterModule,
        NoopAnimationsModule,
        NzLayoutModule,
        NzMenuModule,
        NzDrawerModule,
        NzDropDownModule,
        NzButtonModule,
        NzTooltipDirective,
        IconsProviderModule,
      ],
      providers: [
        { provide: UnsavedChangesService, useValue: { leave: () => Promise.resolve(true) } },
        provideRouter([{ path: '**', component: DestinationComponent }]),
        {
          provide: AuthSessionService,
          useValue: {
            getUser: () => ({ id: 'user', name: 'Ana', role, status: 'ACTIVE' }),
            clear: () => {},
          },
        },
        {
          provide: DataModeService,
          useValue: {
            get local() {
              return demo.value;
            },
          },
        },
        {
          provide: TranslationService,
          useValue: {
            currentLanguage: 'pt',
            languages: [{ code: 'pt', label: 'Português' }],
            languageChanges$: of('pt'),
            instant: (key: string) => key,
            use: () => of('pt'),
          },
        },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(MainLayoutComponent);
    fixture.detectChanges();
  });
  it('keeps desktop and mobile links in the same grouped order', async () => {
    const desktop = links(fixture.nativeElement.querySelector('.nav-menu'));
    expect(desktop).toEqual([
      '/app/dashboard',
      '/app/customer',
      '/app/debts',
      '/app/payment',
      '/app/receipts',
      '/app/company',
      '/app/users',
      '/app/profile',
    ]);
    fixture.componentInstance.isMobileMenuVisible = true;
    fixture.detectChanges();
    await fixture.whenStable();
    const mobile = TestBed.inject(OverlayContainer)
      .getContainerElement()
      .querySelector('.mobile-navigation')!;
    expect(links(mobile)).toEqual(desktop);
    expect(fixture.componentInstance.navigationGroups.map((group) => group.key)).toEqual([
      'general',
      'operations',
      'administration',
      'account',
    ]);
  });
  it('hides unauthorized and empty groups for restricted roles', () => {
    for (const candidate of ['MANAGER', 'OPERATOR', 'TECHNICIAN'] as UserRole[]) {
      role = candidate;
      fixture.detectChanges();
      const paths = links(fixture.nativeElement.querySelector('.nav-menu'));
      expect(paths).not.toContain('/app/company');
      expect(paths).not.toContain('/app/users');
      expect(
        fixture.componentInstance.navigationGroups.every((group) => group.items.length > 0),
      ).toBeTrue();
      if (role === 'TECHNICIAN') expect(paths).toEqual(['/app/dashboard', '/app/profile']);
    }
  });
  it('keeps the owning item selected inside customer and payment details', async () => {
    for (const [route, expected] of [
      ['/app/customer-detail/c1?year=2026', '/app/customer'],
      ['/app/payment-detail/p1', '/app/payment'],
    ]) {
      await TestBed.inject(Router).navigateByUrl(route);
      fixture.detectChanges();
      const selected = fixture.nativeElement.querySelectorAll('.nav-menu a[aria-current="page"]');
      expect(selected.length).toBe(1);
      expect(selected[0].getAttribute('href')).toBe(expected);
      expect(selected[0].closest('li').classList.contains('ant-menu-item-selected')).toBeTrue();
    }
  });
  it('distinguishes the own profile from profiles opened through administration', async () => {
    for (const [route, expected] of [
      ['/app/profile', '/app/profile'],
      ['/app/profile/employee', '/app/users'],
    ]) {
      await TestBed.inject(Router).navigateByUrl(route);
      fixture.detectChanges();
      expect(
        fixture.nativeElement
          .querySelector('.nav-menu a[aria-current="page"]')
          .getAttribute('href'),
      ).toBe(expected);
    }
  });
  it('only displays a footer for demonstration without claiming service availability', () => {
    expect(fixture.nativeElement.querySelector('.sidebar-footer')).toBeNull();
    demo.next(true);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.sidebar-footer').textContent).toContain(
      'layout.status.demoActive',
    );
    expect(fixture.nativeElement.textContent).not.toContain('Sistema ativo');
    demo.next(false);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.sidebar-footer')).toBeNull();
  });
  it('provides labelled tooltips for the collapsed sidebar', () => {
    fixture.componentInstance.isCollapsed = true;
    fixture.detectChanges();
    const link = fixture.debugElement.query(By.css('.nav-menu a'));
    expect(link.injector.get(NzTooltipDirective).title).toBe('layout.nav.dashboard');
    expect(link.nativeElement.getAttribute('aria-label')).toBe('layout.nav.dashboard');
    expect(
      fixture.nativeElement
        .querySelector('.nav-menu')
        .classList.contains('ant-menu-inline-collapsed'),
    ).toBeTrue();
  });
});
