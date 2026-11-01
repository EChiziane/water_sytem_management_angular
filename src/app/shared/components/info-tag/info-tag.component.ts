import {Component, Input} from '@angular/core';
import {NzIconModule} from 'ng-zorro-antd/icon';
import {NzTooltipDirective} from 'ng-zorro-antd/tooltip';
import {TranslationService} from '@core/services/translation.service';
const METHODS: Record<string, [string, string]> = {
 CASH:['cash','bank'], MPESA:['mpesa','phone'], EMOLA:['emola','phone'], BCI:['bci','bank'], BIM:['bim','bank'],
 BANK_TRANSFER:['transfer','bank'], TRANSFER:['transfer','bank'], CARD:['card','credit-card'], POS:['pos','credit-card']
};
@Component({selector:'app-info-tag',standalone:true,imports:[NzIconModule,NzTooltipDirective],
 template: `<span class="info-tag" nz-tooltip [nzTooltipTitle]="label" [attr.aria-label]="label"><nz-icon [nzType]="resolvedIcon" aria-hidden="true"></nz-icon><span>{{ label }}</span></span>`,styleUrl:'./info-tag.component.scss'})
export class InfoTagComponent {
 @Input() kind: 'method'|'reference'|'valve'|'period'|'role'|'text' = 'text';
 @Input() value: unknown;
 constructor(private translations:TranslationService){}
 private get text():string {return this.value == null ? '' : String(this.value).trim();}
 private get method(){return METHODS[this.text.toUpperCase()];}
 get label():string {
  if(!this.text) return this.translations.instant('metadata.notProvided');
  if(this.kind==='method') return this.method ? this.translations.instant('metadata.methods.'+this.method[0]) : this.translations.instant('metadata.otherMethod')+' · '+this.text;
  if(this.kind==='valve') return this.translations.instant('metadata.valve')+' '+this.text;
  return this.text;
 }
 get resolvedIcon():string {
  if(this.kind==='method') return this.method?.[1] || 'info-circle';
  return {reference:'file-text',valve:'database',period:'calendar',role:'user',text:'info-circle'}[this.kind];
 }
}
