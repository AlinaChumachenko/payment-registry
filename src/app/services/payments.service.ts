import { HttpClient } from '@angular/common/http';
import { inject, Inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { PaymentsResponse } from '../models/payments-response';
import { PaymentsQueryParams } from '../models/payments-query-params';

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
  getPayments(params: PaymentsQueryParams): Observable<PaymentsResponse> {
    return this.http.get<PaymentsResponse>(this.apiUrl, {
      params: {
        page: params.page,
        size: params.size,
        sort: params.sort,

        docNumber: params.docNumber,
        payerName: params.payerName,
        receiverName: params.receiverName,

        amountFrom: params.amountFrom ?? '',
        amountTo: params.amountTo ?? '',

        dateFrom: params.dateFrom,
        dateTo: params.dateTo,

        currency: params.currency,
        status: params.status.join(','),
      },
    });
  }
}
