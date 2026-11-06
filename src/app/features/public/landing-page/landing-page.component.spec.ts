import { of } from 'rxjs';
import { LandingPageComponent } from './landing-page.component';

describe('Public company information', () => {
  it('uses the published address for directions and the company phone for WhatsApp', () => {
    const c = new LandingPageComponent(
      {} as any,
      {
        getPublicProfile: () =>
          of({ name: 'Águas Chiziane', address: 'Rua A & B, Maputo', contact: '84 123 4567' }),
      } as any,
      document,
    );
    expect(c.directionsUrl).toBe(
      'https://www.google.com/maps/search/?api=1&query=Rua%20A%20%26%20B%2C%20Maputo',
    );
    expect(c.phoneDigits).toBe('258841234567');
    expect(c.foundedYear).toBe(2012);
    expect(c.currentYear).toBe(new Date().getFullYear());
    const target = { scrollIntoView: jasmine.createSpy('scrollIntoView') };
    spyOn(document, 'getElementById').and.returnValue(target as any);
    const event = {
      preventDefault: jasmine.createSpy('preventDefault'),
      currentTarget: { hash: '#contactos' },
    };
    c.menuVisible = true;
    c.scrollToSection(event as any);
    expect(event.preventDefault).toHaveBeenCalled();
    expect(document.getElementById).toHaveBeenCalledWith('contactos');
    expect(target.scrollIntoView).toHaveBeenCalled();
    expect(c.menuVisible).toBeFalse();
  });
});
