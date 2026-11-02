import {BusinessDatePipe} from '@shared/pipes/business-date.pipe';
import {Component, OnInit} from '@angular/core';
import {CommonModule} from '@angular/common';
import {HttpClient} from '@angular/common/http';
import {Router} from '@angular/router';
import {defer, of, tap, finalize} from 'rxjs';
import {NzButtonModule} from 'ng-zorro-antd/button';
import {NzIconModule} from 'ng-zorro-antd/icon';
import {environment} from '../../../../environments/environments';
import {AuthSessionService} from '@core/auth/auth-session.service';
import {PermissionService} from '@core/auth/permission.service';
import {WaterLocalDataService} from '@core/services/water-local-data.service';
import {OperationConfirmationService} from '@core/services/operation-confirmation.service';
import {TranslationService} from '@core/services/translation.service';

@Component({selector:'app-data-tools',standalone:true,imports:[BusinessDatePipe,CommonModule,NzButtonModule,NzIconModule],template:`
<section class="data-tools" *ngIf="permissions.can('users.manage')" aria-labelledby="backup-title">
 <header><h2 id="backup-title">{{ text('title') }}</h2><span>{{ text(local ? 'localMode' : 'cloudMode') }}</span></header>
 <p>{{ text(local ? 'localNote' : 'cloudNote') }}</p>
 <div class="tools-actions">
  <button nz-button type="button" (click)="exportData()" [disabled]="busy"><nz-icon nzType="download"></nz-icon>{{ text('export') }}</button>
  <button *ngIf="local" nz-button type="button" (click)="exportOriginal()" [disabled]="busy">{{ text('exportOriginal') }}</button>
  <button *ngIf="local" nz-button type="button" (click)="file.click()" [disabled]="busy">{{ text('import') }}</button>
  <input #file type="file" accept=".txt,.json,application/json,text/plain" hidden (change)="selectFile($event)"/>
  <button *ngIf="!local" nz-button type="button" (click)="cloudAction('snapshot')" [disabled]="busy">{{ text('snapshot') }}</button>
  <button *ngIf="!local" nz-button type="button" (click)="cloudAction('spring')" [disabled]="busy">{{ text('spring') }}</button>
  <button *ngIf="!local" nz-button type="button" (click)="cloudAction('test-source')" [disabled]="busy">{{ text('testSource') }}</button>
  <button *ngIf="!local" nz-button type="button" (click)="loadBackups()" [disabled]="busy">{{ text('list') }}</button>
 </div>
 <p *ngIf="lastSpringBackup">{{ text('lastSpring') }}: {{ lastSpringBackup | businessDate:'datetime' }}</p>
 <p *ngIf="notice" role="status">{{ notice }}</p>
 <p *ngIf="error" class="error" role="alert">{{ error }}</p>
 <ul *ngIf="backups.length"><li *ngFor="let backup of backups"><span>{{ backup.name }} · {{ backup.size }} B</span><button nz-button nzSize="small" type="button" (click)="downloadBackup(backup.name)" [disabled]="busy">{{ text('download') }}</button></li></ul>
</section>`,styles:[`
.data-tools{margin-top:16px;padding:16px;border:1px solid var(--wsm-border);border-radius:var(--wsm-radius);background:var(--wsm-surface);}
header{display:flex;align-items:center;gap:12px;flex-wrap:wrap;}h2{margin:0;font-size:14px;font-weight:600;}header span,p{font-size:12px;color:var(--wsm-muted);}p{margin:8px 0;}.tools-actions{display:flex;gap:8px;flex-wrap:wrap;}.error{color:var(--wsm-danger);}ul{list-style:none;padding:0;max-height:280px;overflow:auto;}li{display:flex;justify-content:space-between;gap:12px;align-items:center;padding:6px 0;border-top:1px solid var(--wsm-border);font-size:12px;}li span{overflow-wrap:anywhere;}
`]})
export class DataToolsComponent implements OnInit {
 readonly local=!environment.production && environment.dataMode==='local';
 busy=false;notice='';error='';lastSpringBackup='';backups:Array<{name:string;size:number}>=[];
 constructor(public permissions:PermissionService,private http:HttpClient,private data:WaterLocalDataService,private confirmations:OperationConfirmationService,
  private translations:TranslationService,private session:AuthSessionService,private router:Router){}
 ngOnInit(){if(!this.local && this.permissions.can('users.manage'))this.http.get<{lastSpringBackup?:{at:string}}>(environment.baseURL+'/backups/status').subscribe({next:s=>this.lastSpringBackup=s.lastSpringBackup?.at || '',error:e=>this.error=e.error?.message || this.text('failed')});}
 text(key:string){return this.translations.instant('dataTools.'+key);}
 private download(value:unknown,name:string){const text=typeof value==='string'?value:JSON.stringify(value,null,2);const url=URL.createObjectURL(new Blob([text],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),10000);}
 exportOriginal(){try{this.download(this.data.exportRawBackup(),`water-original-${Date.now()}.txt`);}catch{this.error=this.text('failed');}}
 exportData(){
  if(this.local){try{this.download(this.data.exportState('txt'),`water-backup-${Date.now()}.txt`);}catch{this.error=this.text('corrupt');}return;}
  this.busy=true;this.http.get(environment.baseURL+'/backups/export').pipe(finalize(()=>this.busy=false)).subscribe({next:value=>this.download(value,`water-backup-${Date.now()}.txt`),error:e=>this.error=e.error?.message || this.text('failed')});
 }
 async selectFile(event:Event){
  const input=event.target as HTMLInputElement;const file=input.files?.[0];input.value='';if(!file)return;
  if(file.size>3_000_000){this.error=this.text('invalid');return;}
  try{
   const raw=await file.text();const parsed=JSON.parse(raw),state=parsed.state;
   if(!state || !['customers','payments','receipts','users'].every(k=>Array.isArray(state[k])))throw new Error();
   this.confirmations.run({key:'restore-local-data',title:this.text('importTitle'),description:this.text('importNote'),fields:[[this.text('customers'),String(state.customers.length)],[this.text('payments'),String(state.payments.length)],[this.text('receipts'),String(state.receipts.length)]],confirmLabel:this.text('importConfirm'),danger:true},()=>defer(()=>{
    this.data.restoreBackup(raw);this.session.clear();this.router.navigate(['/login']);return of(true);
   }).pipe(tap({error:()=>this.error=this.text('invalid')})));
  }catch{this.error=this.text('invalid');}
 }
 cloudAction(action:'snapshot'|'spring'|'test-source'){
  this.confirmations.run({key:'backup-'+action,title:this.text(action),description:this.text(action+'Note'),fields:[],confirmLabel:this.text('confirm')},()=>{
   this.busy=true;this.notice='';this.error='';return this.http.post(environment.baseURL+'/backups/'+action,{confirm:true}).pipe(finalize(()=>this.busy=false),tap({next:value=>{this.notice=this.text('done');if(action==='spring')this.ngOnInit();if(action==='test-source')this.download(value,`water-test-${Date.now()}.txt`);},error:e=>this.error=e.error?.message || this.text('failed')}));
  });
 }
 loadBackups(){this.busy=true;this.http.get<Array<{name:string;size:number}>>(environment.baseURL+'/backups').pipe(finalize(()=>this.busy=false)).subscribe({next:value=>this.backups=value,error:e=>this.error=e.error?.message || this.text('failed')});}
 downloadBackup(name:string){this.busy=true;this.http.get(environment.baseURL+'/backups/file/'+encodeURIComponent(name)).pipe(finalize(()=>this.busy=false)).subscribe({next:value=>this.download(value,name),error:e=>this.error=e.error?.message || this.text('failed')});}
}
