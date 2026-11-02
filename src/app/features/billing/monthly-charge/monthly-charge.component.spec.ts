import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MonthlyChargeComponent } from './monthly-charge.component';

describe('MonthlyChargeComponent', () => {
  let component: MonthlyChargeComponent;
  let fixture: ComponentFixture<MonthlyChargeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [MonthlyChargeComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(MonthlyChargeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
