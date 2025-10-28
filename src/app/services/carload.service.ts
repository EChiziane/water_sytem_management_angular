import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Observable, take} from 'rxjs';
import {environment} from '../../environments/environments';
import {CarLoad} from '../models/CSM/carlaod';


@Injectable({
  providedIn: 'root'
})
export class CarloadService {

  private baseURL = environment.baseURL + "/carloads";

  constructor(private http: HttpClient) {
  }

  public getCarloads(): Observable<CarLoad[]> {
    return this.http.get<CarLoad[]>(this.baseURL);
  }

  public getScheduledCarloads(): Observable<CarLoad[]> {
    return this.http.get<CarLoad[]>(`${this.baseURL}/scheduled`);
  }

  public getCarloadsBySprint(id: any): Observable<CarLoad[]> {
    return this.http.get<CarLoad[]>(`${this.baseURL}/sprint/${id}`);
  }

  public encerarCarload(id: any, carload: CarLoad): Observable<CarLoad> {
    return this.http.put<CarLoad>(`${this.baseURL}/${id}`, carload).pipe(take(1));
  }


  public getCarloadById(id: number): Observable<CarLoad> {
    return this.http.get<CarLoad>(`${this.baseURL}/${id}`);
  }

  public addCarload(carload: CarLoad): Observable<CarLoad> {
    return this.http.post<CarLoad>(this.baseURL, carload).pipe(take(1));
  }

  public deleteCarload(id: string): Observable<CarLoad> {
    return this.http.delete<CarLoad>(`${this.baseURL}/${id}`);
  }

  public updateCarload(id: string, carload: CarLoad): Observable<CarLoad> {
    return this.http.put<CarLoad>(`${this.baseURL}/${id}`, carload).pipe(take(1));
  }


}
