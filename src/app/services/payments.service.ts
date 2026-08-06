import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { PaymentsResponse } from '../models/payments-response';
import { PaymentsQueryParams } from '../models/payments-query-params';
import { CreatePayment, Payment, UpdatePayment } from '../models/payment';

@Injectable({
  providedIn: 'root',
})
export class PaymentsService {
  // HTTP client for API requests
  // HTTP-клієнт для запитів до API
  private readonly http = inject(HttpClient);
  private readonly apiUrl = 'http://localhost:3000/payments';

  checkDocNumberExists(docNumber: string): Observable<{ exists: boolean }> {
    return this.http.get<{ exists: boolean }>(`${this.apiUrl}/check-doc-number`, {
      params: {
        docNumber,
      },
    });
  }

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

  getPaymentById(id: string): Observable<Payment> {
    return this.http.get<Payment>(`${this.apiUrl}/${id}`);
  }

  createPayment(payment: CreatePayment): Observable<Payment> {
    return this.http.post<Payment>(this.apiUrl, payment);
  }

  updatePayment(id: string, payment: UpdatePayment): Observable<Payment> {
    return this.http.patch<Payment>(`${this.apiUrl}/${id}`, payment);
  }

  deletePayment(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
