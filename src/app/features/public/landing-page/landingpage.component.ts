import {CompanyProfileService} from '@core/services/company-profile.service';
import {COMPANY_PROFILE} from '@shared/config/company-profile';
import {CompanyProfile} from '@shared/models/company-profile';
import {Component} from '@angular/core';
import {Router} from '@angular/router';

@Component({
    selector: 'app-landingpage',
    standalone: false,
    templateUrl: './landingpage.component.html',
    styleUrl: './landingpage.component.scss'
})
export class LandingPageComponent {
    menuVisible = false;
    company: Pick<CompanyProfile,'name'|'address'|'contact'|'email'|'tagline'> = {...COMPANY_PROFILE};
    get phoneDigits(): string {const digits=this.company.contact.replace(/[^0-9]/g,'');return this.company.contact.trim().startsWith('+') || digits.startsWith('258') ? digits : '258'+digits;}

    constructor(private router: Router, private companies: CompanyProfileService) {
        this.companies.getPublicProfile().subscribe(profile=>this.company=profile);
    }

    goToLogin(): void {
        this.router.navigate(['/login']);
    }
}
