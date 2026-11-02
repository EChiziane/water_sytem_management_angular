import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ReciboComponent } from './receipt.component';

describe('ReciboComponent', () => {
  let component: ReciboComponent;
  let fixture: ComponentFixture<ReciboComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ReciboComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ReciboComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
