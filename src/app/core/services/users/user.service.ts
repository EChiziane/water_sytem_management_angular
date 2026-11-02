import { DataAccessService } from '@core/data/data-access.service';
import { Injectable } from '@angular/core';
import { Observable, map, take } from 'rxjs';
import { User } from '@shared/models/user';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environments';
import { WaterLocalDataService } from '@core/data/demo/water-local-data.service';

type UserPayload = Partial<
  Pick<User, 'name' | 'email' | 'phone' | 'login' | 'password' | 'role' | 'status'>
>;

@Injectable({
  providedIn: 'root',
})
export class UserService {
  private baseURL = environment.baseURL + '/auth';

  constructor(
    private access: DataAccessService,
    private http: HttpClient,
    private localData: WaterLocalDataService,
  ) {}

  getUsers(): Observable<User[]> {
    return this.access.run(
      'users.manage',
      () => this.http.get<User[]>(`${this.baseURL}/users`).pipe(take(1)),
      () => this.localData.getUsers(),
    );
  }

  getUserById(id: string): Observable<User | undefined> {
    return this.getUsers().pipe(map((users) => users.find((user) => user.id === id)));
  }

  addUser(user: UserPayload): Observable<User> {
    return this.access.run(
      'users.manage',
      () => this.http.post<User>(`${this.baseURL}/register`, user).pipe(take(1)),
      () => this.localData.addUser(user),
    );
  }

  updateUser(id: string, user: UserPayload): Observable<User> {
    return this.access.run(
      'users.manage',
      () => this.http.put<User>(`${this.baseURL}/${id}`, user).pipe(take(1)),
      () => this.localData.updateUser(id, user),
    );
  }

  deleteUser(id: string): Observable<User> {
    return this.access.run(
      'users.manage',
      () => this.http.delete<User>(`${this.baseURL}/${id}`).pipe(take(1)),
      () => this.localData.deleteUser(id),
    );
  }
}
