import {TestBed} from '@angular/core/testing';
import {TranslationService} from '@core/services/translation.service';
import {YearFilterComponent} from './year-filter.component';

describe('Historical year selection',()=>{
 it('offers 2012 through 2099 plus all years and emits numeric years',async()=>{
   await TestBed.configureTestingModule({imports:[YearFilterComponent],providers:[{provide:TranslationService,useValue:{instant:(key:string)=>key}}]}).compileComponents();
   const fixture=TestBed.createComponent(YearFilterComponent);fixture.detectChanges();await fixture.whenStable();
   const select=fixture.nativeElement.querySelector('select') as HTMLSelectElement;
   expect(select.options.length).toBe(89);
   const changed=spyOn(fixture.componentInstance.valueChange,'emit');
   select.value=Array.from(select.options).find(option=>option.text==='2012')!.value;
   select.dispatchEvent(new Event('change'));expect(changed).toHaveBeenCalledWith(2012);
   select.value=select.options[0].value;select.dispatchEvent(new Event('change'));expect(changed).toHaveBeenCalledWith(null);
 });
});
