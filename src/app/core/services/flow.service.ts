import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { map, Observable } from 'rxjs';

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

  //
  
  getToken(authConfig: any): Observable<string> {
    console.log('🚀 chungnm2 ~ flow.service.ts ~ authConfig:', authConfig);
    const { url, method, headers, body, token_extract_path } = authConfig;

    // 1. Chuyển đổi headers từ Array [{key, value}] sang Object {key: value}
    const httpHeaders: any = {};
    headers.forEach((h: any) => {
      if (h.key) httpHeaders[h.key] = h.value;
    });

    // 2. Xử lý Body (Mapping dữ liệu)
    const httpBody: any = {};
    const formattedBodyMapping = authConfig.body.map((item: any) => {
      if (item.type === 'datetime_expression') {
        return {
          field: item.field,
          type: 'datetime_expression',
          logic: {
            base: item.logic.base,
            offset_value: item.logic.offset_value,
            offset_unit: item.logic.offset_unit,
            format: item.logic.format,
          },
        };
      } else {
        return {
          field: item.field,
          type: 'constant',
          value: item.type === 'number' ? Number(item.value) : item.value,
        };
      }
    });
    formattedBodyMapping.forEach((item: any) => {
      if (item.type === 'datetime_expression' || (item.logic && item.logic.base)) {
        // Nếu có logic thời gian, tính toán giá trị thực tế
        httpBody[item.field] = this.evaluateDatetimeExpression(item.logic);
      } else {
        // Nếu là giá trị hằng số
        httpBody[item.field] = item.type === 'number' ? Number(item.value) : item.value;
      }
    });

    // 3. Thực hiện call API
    return this.http
      .request(method, url, {
        body: method === 'POST' ? httpBody : null,
        params: method === 'GET' ? httpBody : null,
        headers: httpHeaders,
      })
      .pipe(
        map((response: any) => {
          console.log('🚀 chungnm2 ~ flow.service.ts ~ response:', response);
          // 4. Trích xuất token dựa trên path (ví dụ: "data.access_token")
          return this.getValueByPath(response, token_extract_path);
        }),
      );
  }

  /**
   * Hàm bổ trợ để lấy giá trị từ object theo đường dẫn (dot notation)
   * Ví dụ: path "data.access_token" sẽ lấy res['data']['access_token']
   */
  private getValueByPath(obj: any, path: string): string {
    if (!obj || !path) return '';

    // nếu path bắt đầu bằng "data."
    // thì bỏ đi
    const normalizedPath = path.startsWith('data.') ? path.replace(/^data\./, '') : path;

    return normalizedPath.split('.').reduce((acc, part) => acc?.[part], obj);
  }

  /**
   * Hàm tính toán thời gian dựa trên logic base, offset
   */
  private evaluateDatetimeExpression(logic: any): string {
    const date = new Date(); // base là 'now'

    if (logic.offset_unit === 'HOURS') {
      date.setHours(date.getHours() + (logic.offset_value || 0));
    } else if (logic.offset_unit === 'DAYS') {
      date.setDate(date.getDate() + (logic.offset_value || 0));
    }

    // Ở đây bạn có thể dùng thư viện date-fns hoặc moment để format theo logic.format
    // Ví dụ đơn giản trả về ISO String nếu không có thư viện:
    return date.toISOString();
  }




  callMainApi(token: string, sourceConfig: any): Observable<any> {
    const { url, method, headers, request_param_mapping, body_mapping } = sourceConfig;
    console.log("🚀 chungnm2 ~ flow.service.ts ~ token:", token)
    console.log("🚀 chungnm2 ~ flow.service.ts ~ sourceConfig:", sourceConfig)

    // 1. Xử lý Headers & Inject Token
    let httpHeaders = this.parseHeaders(headers || []);
    console.log("🚀 chungnm2 ~ flow.service.ts ~ token:", token)
    if (token) {
      const authType = sourceConfig.auth_provider?.auth_type || 'Bearer';
      console.log("🚀 chungnm2 ~ flow.service.ts ~ authType:", authType)
      // Tìm key Authorization (không phân biệt hoa thường) để ghi đè token thực tế
      const authKey = Object.keys(httpHeaders).find(k => k.toLowerCase() === 'authorization') || 'Authorization';
      console.log("🚀 chungnm2 ~ flow.service.ts ~ authKey:", authKey)
      httpHeaders = { ...httpHeaders, [authKey]: `${authType} ${token}` };
      console.log("🚀 chungnm2 ~ flow.service.ts ~ httpHeaders:", httpHeaders)
    }

    // 2. Xử lý Params và Body
    const params = this.parseMappingToPayload(request_param_mapping || []);
    const body = this.parseMappingToPayload(body_mapping || []);

    return this.http.request(method, url, {
      body: method !== 'GET' ? body : null,
      params: params,
      headers: httpHeaders
    });
  }

  // --- HELPER METHODS ---

  private parseHeaders(arr: any[]) {
    const obj: any = {};
    arr.forEach(h => { if (h.key) obj[h.key] = h.value; });
    return obj;
  }
private parseMappingToPayload(mappingArray: any[]): any {
  const payload: any = {};

  mappingArray.forEach(item => {
    if (!item.field) return;

    // xử lý datetime dynamic
    if (item.logic && item.logic.base === 'now') {
      payload[item.field] = this.evaluateDatetime(item.logic);
    } else {
      // xử lý value thường
      payload[item.field] =
        item.type === 'number'
          ? Number(item.value)
          : item.value;
    }
  });

  return payload;
}

private evaluateDatetime(logic: any): string {
  const date = new Date();

  // cộng/trừ giờ
  if (logic.offset_unit === 'HOURS') {
    date.setHours(
      date.getHours() + (logic.offset_value || 0)
    );
  }

  // cộng/trừ ngày
  if (logic.offset_unit === 'DAYS') {
    date.setDate(
      date.getDate() + (logic.offset_value || 0)
    );
  }

  // format yyyy-MM-ddTHH:mm:ss
  const pad = (n: number): string =>
    n.toString().padStart(2, '0');

  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

}