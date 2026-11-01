import {Component} from '@angular/core';
import {TestBed} from '@angular/core/testing';
import {NoopAnimationsModule} from '@angular/platform-browser/animations';
import {TranslationService} from '@core/services/translation.service';
import {IconsProviderModule} from '../../../icons-provider.module';
import {StatusBadgeComponent} from './status-badge.component';

@Component({standalone:true,imports:[StatusBadgeComponent],template:`<app-status-badge kind="customer" value="ACTIVE"></app-status-badge><app-status-badge kind="debt" [value]="2"></app-status-badge>`})
class ActiveDebtorComponent {}

describe('Shared status badge',()=>{
 let language:'pt'|'en';
 const labels:Record<string,Record<string,string>>={pt:{'statuses.active.label':'Ativo','statuses.active.hint':'O registo está ativo.','statuses.overdue.label':'Em dívida','statuses.overdue.hint':'Prazo ultrapassado.','statuses.unknown.label':'Não informado'},en:{'statuses.active.label':'Active','statuses.active.hint':'The record is active.','statuses.overdue.label':'Overdue','statuses.overdue.hint':'Payment deadline passed.','statuses.unknown.label':'Not provided'}};
 beforeEach(async()=>{
   language='pt';await TestBed.configureTestingModule({imports:[StatusBadgeComponent,ActiveDebtorComponent,NoopAnimationsModule,IconsProviderModule],providers:[{provide:TranslationService,useValue:{instant:(key:string)=>labels[language][key] || key}}]}).compileComponents();
 });
 it('renders independent lifecycle and debt labels with icons and accessible explanations',()=>{
   const fixture=TestBed.createComponent(ActiveDebtorComponent);fixture.detectChanges();
   const states=fixture.nativeElement.querySelectorAll('[role="img"]');
   expect(states.length).toBe(2);expect(states[0].textContent).toContain('Ativo');expect(states[1].textContent).toContain('Em dívida');
   expect(states[0].getAttribute('aria-label')).toContain('registo está ativo');
   expect(fixture.nativeElement.querySelectorAll('nz-icon svg').length).toBe(2);
   expect(fixture.nativeElement.querySelector('button')).toBeNull();
 });
 it('updates presentation when the interface language changes without mutating the stored code',()=>{
   const fixture=TestBed.createComponent(StatusBadgeComponent);fixture.componentRef.setInput('value','ACTIVE');fixture.detectChanges();
   expect(fixture.nativeElement.textContent).toContain('Ativo');language='en';fixture.detectChanges();
   expect(fixture.nativeElement.textContent).toContain('Active');expect(fixture.componentInstance.value).toBe('ACTIVE');
 });
 it('renders unknown data neutrally and does not leak internal enum values',()=>{
   const fixture=TestBed.createComponent(StatusBadgeComponent);fixture.componentRef.setInput('value','UNEXPECTED_CODE');fixture.detectChanges();
   expect(fixture.nativeElement.textContent).toContain('Não informado');expect(fixture.nativeElement.textContent).not.toContain('UNEXPECTED_CODE');
   expect(fixture.nativeElement.querySelector('[data-tone]').getAttribute('data-tone')).toBe('neutral');
 });
 it('preserves the overdue period count when a payment drawer requests it',()=>{
   const fixture=TestBed.createComponent(StatusBadgeComponent);fixture.componentRef.setInput('kind','debt');fixture.componentRef.setInput('value',3);fixture.componentRef.setInput('showCount',true);fixture.detectChanges();
   expect(fixture.nativeElement.textContent).toContain('Em dívida · 3');expect(fixture.componentInstance.value).toBe(3);
 });
});
