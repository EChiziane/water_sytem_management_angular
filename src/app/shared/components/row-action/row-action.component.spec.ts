import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { provideNzIcons } from 'ng-zorro-antd/icon';
import {
  EyeOutline,
  EditOutline,
  DownloadOutline,
  StopOutline,
  PhoneOutline,
} from '@ant-design/icons-angular/icons';
import { TranslationService } from '@core/services/i18n/translation.service';
import { RowActionComponent } from './row-action.component';

@Component({ standalone: true, template: '' })
class DestinationComponent {}

describe('Shared row actions', () => {
  let fixture: ComponentFixture<RowActionComponent>;
  const labels: Record<string, string> = {
    'tableActions.view': 'Ver detalhes',
    'tableActions.viewShort': 'Ver',
    'tableActions.ownAccount': 'Não pode desativar a sua própria conta',
  };
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RowActionComponent, NoopAnimationsModule],
      providers: [
        provideRouter([{ path: 'app/customer-detail/:id', component: DestinationComponent }]),
        provideNzIcons([EyeOutline, EditOutline, DownloadOutline, StopOutline, PhoneOutline]),
        { provide: TranslationService, useValue: { instant: (key: string) => labels[key] || key } },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(RowActionComponent);
  });
  it('navigates to the supplied record and identifies the record accessibly', async () => {
    fixture.componentRef.setInput('context', 'Maria');
    fixture.componentRef.setInput('route', ['/app/customer-detail', 'customer-001']);
    fixture.detectChanges();
    const button = fixture.nativeElement.querySelector('button') as HTMLButtonElement;
    expect(button.type).toBe('button');
    expect(button.getAttribute('aria-label')).toBe('Ver detalhes · Maria');
    button.click();
    await fixture.whenStable();
    expect(TestBed.inject(Router).url).toBe('/app/customer-detail/customer-001');
  });
  it('never invokes a disabled sensitive action and explains why it is disabled', () => {
    fixture.componentRef.setInput('action', 'deactivate');
    fixture.componentRef.setInput('disabled', true);
    fixture.componentRef.setInput('disabledReason', 'tableActions.ownAccount');
    fixture.detectChanges();
    const activated = spyOn(fixture.componentInstance.activated, 'emit');
    const button = fixture.nativeElement.querySelector('button') as HTMLButtonElement;
    button.click();
    expect(activated).not.toHaveBeenCalled();
    expect(button.getAttribute('aria-label')).toContain('própria conta');
  });
  it('invokes edit once without navigating or submitting a surrounding form', () => {
    fixture.componentRef.setInput('action', 'edit');
    fixture.detectChanges();
    const activated = spyOn(fixture.componentInstance.activated, 'emit');
    (fixture.nativeElement.querySelector('button') as HTMLButtonElement).click();
    expect(activated).toHaveBeenCalledTimes(1);
    expect(TestBed.inject(Router).url).toBe('/');
  });
});
