import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Observable, take} from 'rxjs';
import {environment} from '../../environments/environments';
import {MaterialItem} from '../models/MaterialItem';


@Injectable({
  providedIn: 'root'
})
export class MaterialItemService {
  private baseURL = environment.baseURL + '/invoice-items';

  constructor(private http: HttpClient) {
  }

  public getAll(): Observable<MaterialItem[]> {
    return this.http.get<MaterialItem[]>(this.baseURL);
  }

  public getById(id: string): Observable<MaterialItem> {
    return this.http.get<MaterialItem>(`${this.baseURL}/${id}`);
  }

  public create(material: MaterialItem): Observable<MaterialItem> {
    return this.http.post<MaterialItem>(this.baseURL, material).pipe(take(1));
  }

  public update(id: string, material: MaterialItem): Observable<MaterialItem> {
    return this.http.put<MaterialItem>(`${this.baseURL}/${id}`, material).pipe(take(1));
  }

  public delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseURL}/${id}`);
  }
}
