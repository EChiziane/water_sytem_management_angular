import {AuthSessionService} from '@core/auth/auth-session.service';
import {PermissionService} from '@core/auth/permission.service';
import {CommonModule} from '@angular/common';
import {ComponentFixture, TestBed} from '@angular/core/testing';
import {NoopAnimationsModule} from '@angular/platform-browser/animations';
import {RouterModule} from '@angular/router';
import {of, throwError} from 'rxjs';
import {NzButtonModule} from 'ng-zorro-antd/button';
import {NzSpinModule} from 'ng-zorro-antd/spin';
import {IconsProviderModule} from '../../icons-provider.module';
import {CustomerService} from '@core/services/customer.service';
import {PaymentService} from '@core/services/payment.service';
import {TranslationService} from '@core/services/translation.service';
import {TranslatePipe} from '@shared/pipes/translate.pipe';
import {Customer} from '@shared/models/WSM/customer';
import {Payment} from '@shared/models/WSM/payment';
import {DashboardComponent} from './dashboard.component';

describe('Dashboard monthly activity', () => {
  let fixture: ComponentFixture<DashboardComponent>;
  let customers: jasmine.SpyObj<CustomerService>;
  let payments: jasmine.SpyObj<PaymentService>;
  const customer: Customer = {id: 'customer', code: 'C001', name: 'Cliente exemplo', contact: '+258 840000001', address: 'Morada privada', status: 'ATIVO', valve: 1, monthlyFee: 750, monthsInDebt: 2, unpaidMonths: ['2026-07', '2026-08'], createdAt: '2026-01-01'};
  const payment = (id: string, date: string): Payment => ({id, referenceCode: id, customerId: customer.id, customerName: customer.name, customerContact: customer.contact, customerAddress: customer.address, customerValve: 1, monthlyFee: 750, amount: 9876.54, tax: 0, unitPrice: 750, confirmed: true, referenceMonth: '2026-08', numMonths: 1, paymentDate: date, paymentMethod: 'CASH', createdBy: 'user', createdByName: 'Operador'});

  beforeEach(async () => {
    jasmine.clock().install();
    jasmine.clock().mockDate(new Date('2026-10-29T10:00:00Z'));
    customers = jasmine.createSpyObj('CustomerService', ['getCustomers']);
    customers.getCustomers.and.returnValue(of([customer]));
    payments = jasmine.createSpyObj('PaymentService', ['getPayments']);
    payments.getPayments.and.returnValue(of([payment('october', '2026-10-10T10:00:00Z')]));
    await TestBed.configureTestingModule({
      declarations: [DashboardComponent, TranslatePipe],
      imports: [CommonModule, RouterModule.forRoot([]), NoopAnimationsModule, IconsProviderModule, NzButtonModule, NzSpinModule],
      providers: [
        {provide:AuthSessionService,useValue:{getUser:()=>({role:'ADMIN',status:'ACTIVE'})}},
        {provide: CustomerService, useValue: customers},
        {provide: PaymentService, useValue: payments},
        {provide: TranslationService, useValue: {languageChanges$: of('pt'), instant: (key: string) => key}}
      ]
    }).compileComponents();
    fixture = TestBed.createComponent(DashboardComponent);
    fixture.detectChanges();
  });

  afterEach(() => jasmine.clock().uninstall());

  it('does not request or render customer and financial data for a technician',()=>{
    spyOn(TestBed.inject(PermissionService),'can').and.callFake(permission=>['dashboard.read','profile.read','calendar.read','technical.read'].includes(permission));
    customers.getCustomers.calls.reset();payments.getPayments.calls.reset();
    fixture.componentInstance.loadDashboard();fixture.detectChanges();
    expect(customers.getCustomers).not.toHaveBeenCalled();expect(payments.getPayments).not.toHaveBeenCalled();
    expect(fixture.nativeElement.querySelector('.activity-panel')).toBeNull();
    expect(fixture.nativeElement.querySelector('.operational-counts')).toBeNull();
    expect(fixture.nativeElement.textContent).not.toContain(customer.name);
    expect(fixture.nativeElement.textContent).toContain('access.technicalPending');
  });

  it('shows the two lists and links to their pages without exposing amounts or contacts', () => {
    const page = fixture.nativeElement as HTMLElement;
    expect(page.querySelectorAll('.activity-panel').length).toBe(2);
    expect(page.textContent).toContain(customer.name);
    expect(page.textContent).toContain('29/10/2026');
    expect(page.textContent).not.toContain('9876');
    expect(page.textContent).not.toContain(customer.contact);
    expect(Array.from(page.querySelectorAll('.activity-panel header > a')).map(link => link.getAttribute('href'))).toEqual(['/app/payment', '/app/customer']);
    expect(page.querySelector('button[aria-pressed]')).toBeNull();
  });

  it('uses the payment date, Maputo month boundaries and latest-first ordering with a limit of ten', () => {
    const records = Array.from({length: 12}, (_, i) => payment(`oct-${i + 1}`, `2026-10-${String(i + 1).padStart(2, '0')}T12:00:00Z`));
    payments.getPayments.and.returnValue(of([
      payment('september', '2026-09-30T21:59:59Z'),
      payment('october-start', '2026-09-30T22:00:00Z'),
      ...records.reverse(),
      payment('november', '2026-10-31T22:00:00Z'),
      payment('invalid', 'invalid')
    ]));
    fixture.componentInstance.loadDashboard();
    expect(fixture.componentInstance.recentPayments.map(item => item.id)).toEqual(['oct-12','oct-11','oct-10','oct-9','oct-8','oct-7','oct-6','oct-5','oct-4','oct-3']);
    payments.getPayments.and.returnValue(of([payment('october-start', '2026-09-30T22:00:00Z')]));
    fixture.componentInstance.loadDashboard();
    expect(fixture.componentInstance.recentPayments.length).toBe(1);
  });

  it('shows only customers with recorded debt and limits the list to the ten with most months owed', () => {
    customers.getCustomers.and.returnValue(of(Array.from({length: 13}, (_, i) => ({...customer, id: `c${i}`, monthsInDebt: i}))));
    fixture.componentInstance.loadDashboard();
    expect(fixture.componentInstance.debtors.map(item => item.monthsInDebt)).toEqual([12,11,10,9,8,7,6,5,4,3]);
  });

  it('keeps the customer overview when payments fail and distinguishes an error from an empty month', () => {
    payments.getPayments.and.returnValue(throwError(() => new Error('Unavailable')));
    fixture.componentInstance.loadDashboard();
    fixture.detectChanges();
    expect(fixture.componentInstance.paymentsFailed).toBeTrue();
    expect(fixture.componentInstance.loadFailed).toBeFalse();
    expect(fixture.nativeElement.querySelector('.operational-counts')).not.toBeNull();
    expect(fixture.nativeElement.textContent).toContain('dashboardHome.paymentsError');
    expect(fixture.nativeElement.textContent).not.toContain('dashboardHome.noPayments');
  });

  it('keeps the payments list when customers fail', () => {
    customers.getCustomers.and.returnValue(throwError(() => new Error('Unavailable')));
    fixture.componentInstance.loadDashboard();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.operational-counts')).toBeNull();
    expect(fixture.componentInstance.recentPayments.length).toBe(1);
    expect(fixture.componentInstance.isLoading).toBeFalse();
  });
});
