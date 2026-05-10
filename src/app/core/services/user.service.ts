import {Injectable} from '@angular/core';
import {map, Observable, take} from 'rxjs';
import {User} from '../../models/user';
import {HttpClient} from '@angular/common/http';
import {environment} from '../../../environments/environments';

type UserPayload = Partial<Pick<User, 'name' | 'email' | 'phone' | 'login' | 'password' | 'role' | 'status'>>;

@Injectable({
  providedIn: 'root'
})
export class UserService {


  private baseURL = environment.baseURL + '/auth';

  constructor(private http: HttpClient) {
  }

  getUsers(): Observable<User[]> {
    return this.http.get<User[]>(`${this.baseURL}/users`).pipe(take(1));
  }

  getUserById(id: string): Observable<User | undefined> {
    return this.getUsers().pipe(
      map(users => users.find(user => user.id === id))
    );
  }

  addUser(user: UserPayload): Observable<User> {
    return this.http.post<User>(`${this.baseURL}/register`, user).pipe(take(1));
  }

  updateUser(id: string, user: UserPayload): Observable<User> {
    return this.http.put<User>(`${this.baseURL}/${id}`, user).pipe(take(1));
  }

  deleteUser(id: string): Observable<User> {
    return this.http.delete<User>(`${this.baseURL}/${id}`).pipe(take(1));
  }
}
