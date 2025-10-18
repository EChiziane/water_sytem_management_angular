import { ComponentFixture, TestBed } from '@angular/core/testing';

import { QuantitiesCardsComponent } from './quantities-cards.component';

describe('QuantitiesCardsComponent', () => {
  let component: QuantitiesCardsComponent;
  let fixture: ComponentFixture<QuantitiesCardsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [QuantitiesCardsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(QuantitiesCardsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
