import {ComponentFixture, TestBed} from '@angular/core/testing';

import {CarloadCotacaoComponent} from './carload-cotacao.component';

describe('CarloadCotacaoComponent', () => {
  let component: CarloadCotacaoComponent;
  let fixture: ComponentFixture<CarloadCotacaoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [CarloadCotacaoComponent]
    })
      .compileComponents();

    fixture = TestBed.createComponent(CarloadCotacaoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
