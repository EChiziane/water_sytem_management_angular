import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Observable, take} from 'rxjs';
import {environment} from '../../environments/environments';
import {Teacher} from '../models/EISSM/Teacher';


@Injectable({
  providedIn: 'root'
})
export class TeacherService {

  private baseURL = environment.baseURL + '/teachers';

  constructor(private http: HttpClient) {
  }

  getTeachers(): Observable<Teacher[]> {
    return this.http.get<Teacher[]>(this.baseURL);
  }

  getTeacherById(id: string): Observable<Teacher> {
    return this.http.get<Teacher>(`${this.baseURL}/${id}`);
  }

  addTeacher(teacher: Teacher): Observable<Teacher> {
    return this.http.post<Teacher>(this.baseURL, teacher).pipe(take(1));
  }

  updateTeacher(id: string, teacher: Teacher): Observable<Teacher> {
    return this.http.put<Teacher>(`${this.baseURL}/${id}`, teacher).pipe(take(1));
  }

  deleteTeacher(id: string): Observable<any> {
    return this.http.delete(`${this.baseURL}/${id}`);
  }
}
