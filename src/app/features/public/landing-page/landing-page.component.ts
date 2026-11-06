import { CompanyProfileService } from '@core/services/company/company-profile.service';
import { COMPANY_PROFILE } from '@shared/config/company-profile';
import { CompanyProfile } from '@shared/models/company-profile';
import { Component, Inject } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  selector: 'app-landingpage',
  standalone: false,
  templateUrl: './landing-page.component.html',
  styleUrl: './landing-page.component.scss',
})
export class LandingPageComponent {
  readonly currentYear = new Date().getFullYear();
  readonly foundedYear = 2012;
  readonly openingHours = 'Seg–Sex: 08h às 17h | Sáb: 08h às 12h';
  get directionsUrl(): string {
    return (
      'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(this.company.address)
    );
  }
  menuVisible = false;
  company: Pick<CompanyProfile, 'name' | 'address' | 'contact' | 'email' | 'tagline'> = {
    ...COMPANY_PROFILE,
  };
  get phoneDigits(): string {
    const digits = this.company.contact.replace(/[^0-9]/g, '');
    return this.company.contact.trim().startsWith('+') || digits.startsWith('258')
      ? digits
      : '258' + digits;
  }

  constructor(
    private router: Router,
    private companies: CompanyProfileService,
    @Inject(DOCUMENT) private document: Document,
  ) {
    this.companies.getPublicProfile().subscribe((profile) => (this.company = profile));
  }

  goToLogin(): void {
    this.router.navigate(['/login']);
  }
  scrollToSection(event: Event): void {
    event.preventDefault();
    this.menuVisible = false;
    const id = (event.currentTarget as HTMLAnchorElement).hash.slice(1);
    this.document.getElementById(id)?.scrollIntoView({ block: 'start' });
  }
}
