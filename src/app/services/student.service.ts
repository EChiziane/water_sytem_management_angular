import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environments';
import { Observable, take } from 'rxjs';
import {Student} from '../models/EISSM/students';


@Injectable({
  providedIn: 'root'
})
export class StudentService {

  private baseURL = `${environment.baseURL}/students`;

  constructor(private http: HttpClient) {}

  getStudents(): Observable<Student[]> {
    return this.http.get<Student[]>(this.baseURL);
  }

  printStudentInvoice(id: string):Observable<Student> {
return this.http.get<Student>(`${this.baseURL}/recibo/${id}` );
  }
  getStudentById(id: string): Observable<Student> {
    return this.http.get<Student>(`${this.baseURL}/${id}`);
  }

  addStudent(student: Student): Observable<Student> {
    return this.http.post<Student>(this.baseURL, student).pipe(take(1));
  }

  updateStudent(id: string, student: Student): Observable<Student> {
    return this.http.put<Student>(`${this.baseURL}/${id}`, student).pipe(take(1));
  }

  deleteStudent(id: string): Observable<any> {
    return this.http.delete(`${this.baseURL}/${id}`).pipe(take(1));
  }


}
