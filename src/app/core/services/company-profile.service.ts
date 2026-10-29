import {Injectable} from '@angular/core';
import {HttpClient, HttpErrorResponse} from '@angular/common/http';
import {BehaviorSubject, Observable, catchError, defer, of, tap, map, throwError} from 'rxjs';
import {CompanyProfile} from '@shared/models/company-profile';
import {COMPANY_PROFILE} from '@shared/config/company-profile';
import {environment} from '../../../environments/environments';
import {AuthSessionService} from '@core/auth/auth-session.service';

@Injectable({providedIn:'root'})
export class CompanyProfileService {
  readonly source$ = new BehaviorSubject<'none'|'api'|'demo'>('none');
  private readonly storageKey = `${environment.waterStorageKey}-company`;
  private readonly url = `${environment.baseURL}/company`;
  constructor(private http: HttpClient, private session: AuthSessionService) {}

  getProfile(): Observable<CompanyProfile> {
    return this.http.get<CompanyProfile>(this.url).pipe(tap(() => this.source$.next('api')), catchError((error: HttpErrorResponse) => {
      if (!environment.production && environment.useLocalFallback && this.source$.value !== 'api' && error.status === 0) {
        return defer(() => {const profile=this.readLocal();this.source$.next('demo');return of(profile);});
      }
      return throwError(() => error);
    }));
  }

  getPublicProfile(): Observable<Pick<CompanyProfile,'name'|'address'|'contact'|'email'|'tagline'>> {
    const published=(profile:CompanyProfile)=>({name:profile.name,address:profile.address,contact:profile.contact,email:profile.email,tagline:profile.tagline});
    return this.http.get<CompanyProfile>(this.url+'/public').pipe(map(published),catchError((error:HttpErrorResponse)=>defer(()=>{
      const profile=!environment.production && environment.useLocalFallback && error.status===0 ? this.readLocal() : {...COMPANY_PROFILE};
      return of(published(profile));
    })));
  }

  save(profile: CompanyProfile): Observable<CompanyProfile> {
    const fields = {name:profile.name.trim(),address:profile.address.trim(),contact:profile.contact.trim(),email:profile.email.trim(),nuit:profile.nuit.trim(),tagline:profile.tagline.trim(),version:profile.version ?? null};
    if(this.source$.value === 'demo') return defer(() => {
      const current=this.readLocal();
      if((current.version ?? null) !== fields.version) return throwError(() => new HttpErrorResponse({status:409}));
      const saved={...fields,version:(current.version ?? -1)+1,updatedAt:new Date().toISOString(),updatedBy:this.session.getUser()?.id || 'demo-user'};
      localStorage.setItem(this.storageKey,JSON.stringify(saved));
      return of(saved);
    });
    if(this.source$.value !== 'api') return throwError(() => new Error('Load the company profile before saving.'));
    // A failed API write must never be converted into a local success.
    return this.http.put<CompanyProfile>(this.url,fields);
  }

  private readLocal(): CompanyProfile {
    const raw=typeof localStorage !== 'undefined' ? localStorage.getItem(this.storageKey) : null;
    if(raw){try{return {...COMPANY_PROFILE,...JSON.parse(raw)};}catch{throw new Error('Invalid local company profile.');}}
    return {...COMPANY_PROFILE,version:null,updatedAt:null,updatedBy:null};
  }
}
