import { TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { TranslationService } from '@core/services/i18n/translation.service';
import { IconsProviderModule } from '../../../core/icons/icons-provider.module';
import { InfoTagComponent } from './info-tag.component';
describe('Information tags', () => {
  let language: string;
  beforeEach(async () => {
    language = 'pt';
    await TestBed.configureTestingModule({
      imports: [InfoTagComponent, IconsProviderModule, NoopAnimationsModule],
      providers: [
        {
          provide: TranslationService,
          useValue: {
            instant: (key: string) =>
              ({
                'metadata.methods.cash': language === 'pt' ? 'Numerário' : 'Cash',
                'metadata.notProvided': 'Não informado',
                'metadata.otherMethod': 'Outro método',
                'metadata.valve': 'Válvula',
                'metadata.methods.bci': 'BCI',
                'metadata.methods.bim': 'BIM',
                'metadata.methods.transfer': 'Transferência bancária',
              })[key] || key,
          },
        },
      ],
    }).compileComponents();
  });
  it('translates cash without changing its stored code', () => {
    const f = TestBed.createComponent(InfoTagComponent);
    f.componentRef.setInput('kind', 'method');
    f.componentRef.setInput('value', ' CASH ');
    f.detectChanges();
    expect(f.nativeElement.textContent).toContain('Numerário');
    language = 'en';
    f.detectChanges();
    expect(f.nativeElement.textContent).toContain('Cash');
    expect(f.componentInstance.value).toBe(' CASH ');
    expect(f.nativeElement.querySelector('nz-icon svg')).not.toBeNull();
  });
  it('keeps missing and unfamiliar methods distinct from cash', () => {
    const f = TestBed.createComponent(InfoTagComponent);
    f.componentRef.setInput('kind', 'method');
    f.detectChanges();
    expect(f.nativeElement.textContent).toContain('Não informado');
    f.componentRef.setInput('value', 'LEGACY');
    f.detectChanges();
    expect(f.nativeElement.textContent).toContain('Outro método · LEGACY');
    expect(f.nativeElement.textContent).not.toContain('Numerário');
  });
  it('preserves bank identities and supports historical transfer aliases', () => {
    const f = TestBed.createComponent(InfoTagComponent);
    f.componentRef.setInput('kind', 'method');
    for (const code of ['BCI', 'BIM']) {
      f.componentRef.setInput('value', code);
      f.detectChanges();
      expect(f.nativeElement.textContent.trim()).toBe(code);
    }
    for (const code of ['TRANSFER', 'BANK_TRANSFER']) {
      f.componentRef.setInput('value', code);
      f.detectChanges();
      expect(f.nativeElement.textContent).toContain('Transferência bancária');
    }
  });
  it('preserves zero identifiers and exposes complete reference text accessibly', () => {
    const f = TestBed.createComponent(InfoTagComponent);
    f.componentRef.setInput('kind', 'valve');
    f.componentRef.setInput('value', 0);
    f.detectChanges();
    expect(f.nativeElement.textContent).toContain('Válvula 0');
    f.componentRef.setInput('kind', 'reference');
    f.componentRef.setInput('value', 'AC-2026-000123');
    f.detectChanges();
    expect(f.nativeElement.querySelector('[aria-label]').getAttribute('aria-label')).toBe(
      'AC-2026-000123',
    );
    expect(f.nativeElement.querySelector('button')).toBeNull();
  });
});
