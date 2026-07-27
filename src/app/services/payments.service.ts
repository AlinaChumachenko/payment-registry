import { HttpClient } from '@angular/common/http';
import { inject, Inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { PaymentsResponse } from '../models/payments-response';

@Injectable({
  providedIn: 'root',
})
export class PaymentsService {
  // HTTP client for API requests
  // HTTP-клієнт для запитів до API
  private readonly http = inject(HttpClient);
  private readonly apiUrl = 'http://localhost:3000/payments';

  // Load payments from the server
  // Завантажуємо платежі із сервера
  getPayments(page: number, size: number, sort: string): Observable<PaymentsResponse> {
    return this.http.get<PaymentsResponse>(this.apiUrl, {
      params: {
        page,
        size,
        sort,
      },
    });
  }
}
