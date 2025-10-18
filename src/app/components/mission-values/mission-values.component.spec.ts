import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MissionValuesComponent } from './mission-values.component';

describe('MissionValuesComponent', () => {
  let component: MissionValuesComponent;
  let fixture: ComponentFixture<MissionValuesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [MissionValuesComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MissionValuesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
