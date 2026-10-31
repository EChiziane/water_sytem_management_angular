import {PermissionService} from '@core/auth/permission.service';
import {Component, OnInit} from '@angular/core';
import {WaterLocalDataService} from '@core/services/water-local-data.service';
import {Router} from '@angular/router';
import {AuthSessionService} from '@core/auth/auth-session.service';
import {ROLE_LABELS} from '@shared/constants/app-labels';
import {TranslationService} from '@core/services/translation.service';

@Component({
  selector: 'app-main-layout',
  standalone: false,
  templateUrl: './main-layout.component.html',
  styleUrl: './main-layout.component.scss'
})
export class MainLayoutComponent implements OnInit {
  isCollapsed = false;
  isMobileMenuVisible = false;

  username: string = 'Utilizador';

  userInitials: string = 'UT';

  userRole: string = 'Conta autenticada';

  isAdmin = false;

  constructor(public permissions: PermissionService,
    private router: Router,
    private session: AuthSessionService,
    public localData: WaterLocalDataService,
    public translationService: TranslationService
  ) {
  }

  ngOnInit(): void {
    const user = this.session.getUser();

    if (user) {
      this.username = user.name ?? user.login ?? 'Utilizador';
      this.userInitials = this.getInitials(this.username);
      this.userRole = this.getRoleLabel(user.role);
      this.isAdmin = user.role === 'ADMIN';
    }
  }

  togglePrimaryNavigation(): void {
    if (typeof window !== 'undefined' && window.innerWidth <= 900) {
      this.isMobileMenuVisible = true;
      return;
    }

    this.isCollapsed = !this.isCollapsed;
  }

  closeMobileMenu(): void {
    this.isMobileMenuVisible = false;
  }

  logout(): void {
    this.session.clear();
    this.router.navigate(['/landing-page']);
  }

  get currentLanguage(): string {
    return this.translationService.currentLanguage;
  }

  get currentLanguageLabel(): string {
    return this.translationService.languages.find(language => language.code === this.currentLanguage)?.label
      || this.currentLanguage.toUpperCase();
  }

  changeLanguage(language: string): void {
    if (language === this.currentLanguage) {
      return;
    }

    this.translationService.use(language).subscribe(() => {
      const user = this.session.getUser();
      this.userRole = this.getRoleLabel(user?.role);
    });
  }

  languageShortLabel(languageCode: string): string {
    return languageCode.toUpperCase();
  }

  private getInitials(name: string): string {
    const initials = name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map(part => part.charAt(0).toUpperCase())
      .join('');

    return initials || 'UT';
  }

  private getRoleLabel(role?: string | null): string {
    return role && role in ROLE_LABELS ? ROLE_LABELS[role as keyof typeof ROLE_LABELS] : 'Conta autenticada';
  }
}
