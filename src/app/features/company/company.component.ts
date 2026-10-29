import {Component, OnInit} from '@angular/core';
import {FormBuilder, Validators} from '@angular/forms';
import {finalize, tap, of} from 'rxjs';
import {NzMessageService} from 'ng-zorro-antd/message';
import {CompanyProfileService} from '@core/services/company-profile.service';
import {OperationConfirmationService} from '@core/services/operation-confirmation.service';
import {TranslationService} from '@core/services/translation.service';
import {CompanyProfile} from '@shared/models/company-profile';

@Component({selector:'app-company',standalone:false,templateUrl:'./company.component.html',styleUrl:'./company.component.scss'})
export class CompanyComponent implements OnInit {
  isLoading=false;
  isSaving=false;
  loadFailed=false;
  profile: CompanyProfile | null=null;
  readonly form;
  constructor(private fb: FormBuilder, public company: CompanyProfileService, private confirmations: OperationConfirmationService,
    private messages: NzMessageService, private translations: TranslationService){
    const required=(max:number)=>[Validators.required,Validators.pattern(/\S/),Validators.maxLength(max)];
    this.form=this.fb.nonNullable.group({
      name:['',required(100)],nuit:['',[Validators.required,Validators.pattern(/^[0-9]{9}$/)]],
      address:['',required(240)],contact:['',[Validators.required,Validators.pattern(/^[+0-9 ()-]{7,30}$/)]],
      email:['',[Validators.required,Validators.email,Validators.maxLength(120)]],tagline:['',[Validators.maxLength(160)]]
    });
  }
  ngOnInit(): void { this.load(); }
  text(key:string):string{return this.translations.instant(`company.${key}`);}
  load(): void {
    this.isLoading=true;this.loadFailed=false;this.form.disable();
    this.company.getProfile().pipe(finalize(()=>{this.isLoading=false;if(this.profile && !this.loadFailed)this.form.enable();})).subscribe({
      next:profile=>{this.profile=profile;this.form.reset(profile);},
      error:()=>{this.loadFailed=true;this.messages.error(this.text('loadError'));}
    });
  }
  reload(): void {
    if(!this.form.dirty){this.load();return;}
    this.confirmations.run({key:'reload-company',title:this.text('discardTitle'),description:this.text('discardDescription'),fields:[],confirmLabel:this.text('reload')},()=>of(null).pipe(tap(()=>this.load())));
  }
  save(): void {
    if(this.isSaving || this.isLoading || this.loadFailed || !this.profile)return;
    if(this.form.invalid){this.form.markAllAsTouched();return;}
    const payload={...this.form.getRawValue(),version:this.profile.version ?? null};
    this.confirmations.run({key:'save-company',title:this.text('confirmTitle'),description:this.text('confirmDescription'),
      fields:[[this.text('name'),payload.name],[this.text('nuit'),payload.nuit],[this.text('address'),payload.address],[this.text('contact'),payload.contact],[this.text('email'),payload.email]],
      confirmLabel:this.text('confirmSave')},()=>{
        this.isSaving=true;this.form.disable();
        return this.company.save(payload).pipe(finalize(()=>{this.isSaving=false;this.form.enable();}),tap({
          next:profile=>{this.profile=profile;this.form.reset(profile);this.messages.success(this.text('saved'));},
          error:error=>this.messages.error(this.text(error.status === 409 ? 'conflict' : 'saveError'))
        }));
      });
  }
}
