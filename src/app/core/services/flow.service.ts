import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class FlowService {
  private http = inject(HttpClient);
  private readonly API_URL = `${environment.apiUrl}/flows`;

  // Lấy danh sách flows đã lưu
  getFlows(page: number, size: number): Observable<any> {
    const params = new HttpParams().set('page', page.toString()).set('size', size.toString());

    return this.http.get<any>(this.API_URL, { params });
  }

  // Lưu một flow mới
  saveFlow(flowData: any): Observable<any> {
    return this.http.post<any>(this.API_URL, flowData);
  }

  // Xóa flow (tùy chọn thêm)
  deleteFlow(id: string): Observable<any> {
    return this.http.delete(`${this.API_URL}/${id}`);
  }
}