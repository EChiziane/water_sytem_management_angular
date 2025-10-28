import {Injectable} from "@angular/core";
import {environment} from '../../environments/environments';
import {HttpClient} from '@angular/common/http';
import {Observable, take} from 'rxjs';
import {CarloadCotacao} from '../models/CSM/carloadInvoice';

@Injectable({
  providedIn: 'root'
})
export class CarloadCotacaoService {
  private baseURL = `${environment.baseURL}/carload-cotacoes`;

  constructor(private http: HttpClient) {
  }

  getCotacoes(): Observable<CarloadCotacao[]> {
    return this.http.get<CarloadCotacao[]>(this.baseURL);
  }

  getCotacaoById(id: string): Observable<CarloadCotacao> {
    return this.http.get<CarloadCotacao>(`${this.baseURL}/${id}`);
  }

  addCotacao(invoice: CarloadCotacao): Observable<CarloadCotacao> {
    return this.http.post<CarloadCotacao>(this.baseURL, invoice).pipe(take(1));
  }

  updateCotacao(id: string, invoice: CarloadCotacao): Observable<CarloadCotacao> {
    return this.http.put<CarloadCotacao>(`${this.baseURL}/${id}`, invoice).pipe(take(1));
  }

  deleteCotacao(id: string): Observable<CarloadCotacao> {
    return this.http.delete<CarloadCotacao>(`${this.baseURL}/${id}`);
  }

  public getDownloadUrl(id: string): Observable<CarloadCotacao> {
    return this.http.get<CarloadCotacao>(`${this.baseURL}/download/${id}`);
  }

  downloadRecibo(id: string) {
    return this.http.get(`${this.baseURL}/download/${id}`, {
      responseType: 'blob' // 👈 Isto diz ao Angular que é um ficheiro, não JSON
    });
  }

}
