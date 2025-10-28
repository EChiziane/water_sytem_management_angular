import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Observable, take} from 'rxjs';

import {environment} from '../../environments/environments';
import {Classroom} from '../models/classroom';

@Injectable({
  providedIn: 'root'
})
export class ClassroomService {

  private baseURL = `${environment.baseURL}/classrooms`;

  constructor(private http: HttpClient) {
  }

  public getClassrooms(): Observable<Classroom[]> {
    return this.http.get<Classroom[]>(this.baseURL);
  }

  public getClassroomById(id: string): Observable<Classroom> {
    return this.http.get<Classroom>(`${this.baseURL}/${id}`);
  }

  public addClassroom(classroom: Classroom): Observable<Classroom> {
    return this.http.post<Classroom>(this.baseURL, classroom).pipe(take(1));
  }

  public updateClassroom(id: string, classroom: Classroom): Observable<Classroom> {
    return this.http.put<Classroom>(`${this.baseURL}/${id}`, classroom).pipe(take(1));
  }

  public deleteClassroom(id: string): Observable<any> {
    return this.http.delete(`${this.baseURL}/${id}`);
  }
}
