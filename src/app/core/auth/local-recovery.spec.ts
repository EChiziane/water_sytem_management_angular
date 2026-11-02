import {TestBed} from '@angular/core/testing';
import {provideHttpClient} from '@angular/common/http';
import {provideHttpClientTesting,HttpTestingController} from '@angular/common/http/testing';
import {environment} from '../../../environments/environments';
import {WaterLocalDataService} from '../services/water-local-data.service';
import {PermissionService} from './permission.service';
import {AuthSessionService} from './auth-session.service';
import {DEMO_USERS} from '@shared/config/demo-users';
import {AuthService} from './auth.service';
describe('Local TXT data and recovery',()=>{
 let service:WaterLocalDataService,http:HttpTestingController,original:string|null,company:string|null,keys:Set<string>;
 const key=environment.waterStorageKey;
 const state=()=>({customers:[],payments:[],receipts:[],users:[{...DEMO_USERS[0]}]});
 beforeEach(()=>{
  original=localStorage.getItem(key);company=localStorage.getItem(key+'-company');keys=new Set(Object.keys(localStorage));localStorage.removeItem(key);
  TestBed.configureTestingModule({providers:[provideHttpClient(),provideHttpClientTesting(),{provide:PermissionService,useValue:{require:()=>{},can:()=>true}},{provide:AuthSessionService,useValue:{getUser:()=>DEMO_USERS[0],getToken:()=> 'local-water-session',clear:()=>{},setToken:()=>{},setUser:()=>{}}}]});
  service=TestBed.inject(WaterLocalDataService);http=TestBed.inject(HttpTestingController);
 });
 afterEach(()=>{http.verify();for(const name of Object.keys(localStorage))if(name.startsWith(key+'-before-import-') && !keys.has(name))localStorage.removeItem(name);if(original===null)localStorage.removeItem(key);else localStorage.setItem(key,original);if(company===null)localStorage.removeItem(key+'-company');else localStorage.setItem(key+'-company',company);});
 it('loads the initial TXT and never calls Spring for an explicit local login',()=>{
  let user='';TestBed.inject(AuthService).login('anaAC','123456').subscribe(u=>user=u.login);
  http.expectNone(environment.baseURL+'/auth/login');http.expectOne(environment.waterDataSourcePath).flush({version:'test',...state()});
  expect(user).toBe('anaAC');expect(localStorage.getItem(key)).not.toBeNull();
 });
 it('preserves an existing local state rather than reloading new seed data',()=>{
  const originalState={...state(),users:[{...DEMO_USERS[0],name:'Nome preservado'}]};localStorage.setItem(key,JSON.stringify(originalState));
  service.getUsers().subscribe(users=>expect(users[0].name).toBe('Nome preservado'));http.expectNone(environment.waterDataSourcePath);
 });
 it('does not replace a corrupted original with empty seed data',()=>{
  localStorage.setItem(key,'{broken');expect(()=>service.getCustomers()).toThrow();expect(localStorage.getItem(key)).toBe('{broken');expect(JSON.parse(service.exportRawBackup()).raw).toBe('{broken');http.expectNone(environment.waterDataSourcePath);
 });
 it('does not create an empty state when the TXT cannot be loaded',()=>{
  let status=0;service.getUsers().subscribe({next:()=>fail(),error:e=>status=e.status});http.expectOne(environment.waterDataSourcePath).flush('',{status:404,statusText:'Not found'});expect(status).toBe(404);expect(localStorage.getItem(key)).toBeNull();
 });
 it('preserves exact previous bytes and company before an explicit restore',()=>{
  const previous=JSON.stringify(state());localStorage.setItem(key,previous);localStorage.setItem(key+'-company','{"name":"Empresa original"}');
  service.restoreBackup(JSON.stringify({state:state(),company:{name:'Empresa importada'}}));
  const name=Object.keys(localStorage).find(name=>name.startsWith(key+'-before-import-') && !keys.has(name))!;
  const preserved=JSON.parse(localStorage.getItem(name)!);expect(preserved.raw).toBe(previous);expect(preserved.company).toContain('Empresa original');expect(localStorage.getItem(key+'-company')).toContain('Empresa importada');
 });
 it('rejects invalid backup references without replacing the current data',()=>{
  const previous=JSON.stringify(state());localStorage.setItem(key,previous);
  expect(()=>service.restoreBackup(JSON.stringify({state:{...state(),payments:[{id:'p1',amount:500,referenceCode:'R1',confirmed:true,customerId:'missing'}]}}))).toThrow();expect(localStorage.getItem(key)).toBe(previous);
 });
 it('aborts import when an original recovery copy cannot be stored',()=>{
  const previous=JSON.stringify(state());localStorage.setItem(key,previous);const write=Storage.prototype.setItem;
  spyOn(Storage.prototype,'setItem').and.callFake(function(this:Storage,k:string,v:string){if(k.includes('-before-import-'))throw new DOMException('quota','QuotaExceededError');write.call(this,k,v);});
  expect(()=>service.restoreBackup(JSON.stringify({state:state()}))).toThrow();expect(localStorage.getItem(key)).toBe(previous);
 });
});
