import {TestBed} from '@angular/core/testing';
import {provideHttpClient} from '@angular/common/http';
import {provideHttpClientTesting,HttpTestingController} from '@angular/common/http/testing';
import {AuthSessionService} from './auth-session.service';
import {AuthService} from './auth.service';
import {PermissionService} from './permission.service';
import {DEMO_USERS} from '@shared/config/demo-users';
import {environment} from '../../../environments/environments';

describe('Session integrity and demonstration login',()=>{
 let originals:Map<string,string|null>;
 let session:AuthSessionService;
 const keys=['token','user',environment.waterStorageKey];
 beforeEach(()=>{
   originals=new Map(keys.map(key=>[key,localStorage.getItem(key)]));
   keys.forEach(key=>localStorage.removeItem(key));
   TestBed.configureTestingModule({providers:[provideHttpClient(),provideHttpClientTesting()]});
   session=TestBed.inject(AuthSessionService);
 });
 afterEach(()=>{TestBed.inject(HttpTestingController).verify();for(const [key,value] of originals)if(value===null)localStorage.removeItem(key);else localStorage.setItem(key,value);});
 it('rejects malformed tokens, missing expiry and inactive sessions',()=>{
   session.setUser(DEMO_USERS[0]);
   for(const token of ['invalid','a.invalid.c','a.'+btoa('{}')+'.c','a.'+btoa('{"exp":1}')+'.c']){session.setToken(token);expect(session.hasValidSession()).toBeFalse();}
   session.setToken('a.'+btoa(JSON.stringify({exp:Math.floor(Date.now()/1000)+60}))+'.c');expect(session.hasValidSession()).toBeTrue();
   session.setUser({...DEMO_USERS[0],status:'INACTIVE'});expect(session.hasValidSession()).toBeFalse();
 });
 it('creates missing demonstration role accounts on offline login and stores no PIN in the session',()=>{
   localStorage.setItem(environment.waterStorageKey,JSON.stringify({customers:[],payments:[],receipts:[],users:[]}));
   let role='';TestBed.inject(AuthService).login('carlaAC','123456').subscribe(user=>role=user.role);
   TestBed.inject(HttpTestingController).expectNone(environment.baseURL+'/auth/login');
   expect(role).toBe('OPERATOR');expect(session.hasValidSession()).toBeTrue();
   expect(localStorage.getItem('user')).not.toContain('password');expect(localStorage.getItem('user')).not.toContain('123456');
   expect(TestBed.inject(PermissionService).can('company.manage')).toBeFalse();
 });
 it('rechecks role and activation against the demonstration account after account changes',()=>{
   session.setUser(DEMO_USERS[2]);session.setToken('local-water-session');
   localStorage.setItem(environment.waterStorageKey,JSON.stringify({users:[{...DEMO_USERS[2],status:'INACTIVE'}]}));
   expect(session.hasValidSession()).toBeFalse();expect(TestBed.inject(PermissionService).can('payments.create')).toBeFalse();
 });
});
