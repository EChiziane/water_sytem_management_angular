import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CarloadInvoiceComponent } from './carload-invoice.component';

describe('CarloadInvoiceComponent', () => {
  let component: CarloadInvoiceComponent;
  let fixture: ComponentFixture<CarloadInvoiceComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [CarloadInvoiceComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CarloadInvoiceComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
