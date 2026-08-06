import { DestroyRef, inject, Injectable, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { catchError, finalize, of, Subject, switchMap } from 'rxjs';

import { Payment } from '../models/payment';
import { PaymentsService } from '../services/payments.service';
import { PaymentsQueryParams } from '../models/payments-query-params';
import { PaymentsFilters } from '../models/payments-filters';

@Injectable({
  providedIn: 'root',
})
export class PaymentsStore {
  private readonly paymentsService = inject(PaymentsService);
  private readonly destroyRef = inject(DestroyRef);

  private readonly loadPaymentsTrigger = new Subject<void>();

  // Internal writable state
  // Внутрішній стан, який може змінювати тільки store
  private readonly itemsState = signal<Payment[]>([]);
  private readonly totalState = signal(0);
  private readonly loadingState = signal(false);
  private readonly errorState = signal<string | null>(null);
  private readonly pageState = signal(1);
  private readonly pageSizeState = signal(25);
  private readonly sortState = signal('');
  private readonly filtersState = signal<PaymentsFilters>({
    docNumber: '',
    payerName: '',
    receiverName: '',

    amountFrom: null,
    amountTo: null,

    dateFrom: '',
    dateTo: '',

    currency: '',
    status: [],
  });

  // Public read-only state
  // Публічний стан лише для читання
  readonly items = this.itemsState.asReadonly();
  readonly total = this.totalState.asReadonly();
  readonly loading = this.loadingState.asReadonly();
  readonly error = this.errorState.asReadonly();
  readonly page = this.pageState.asReadonly();
  readonly pageSize = this.pageSizeState.asReadonly();
  readonly sort = this.sortState.asReadonly();
  readonly filters = this.filtersState.asReadonly();

  constructor() {
    this.loadPaymentsTrigger
      .pipe(
        switchMap(() => {
          this.loadingState.set(true);
          this.errorState.set(null);

          const filters = this.filtersState();

          const params: PaymentsQueryParams = {
            page: this.pageState(),
            size: this.pageSizeState(),
            sort: this.sortState(),

            docNumber: filters.docNumber,
            payerName: filters.payerName,
            receiverName: filters.receiverName,

            amountFrom: filters.amountFrom,
            amountTo: filters.amountTo,

            dateFrom: filters.dateFrom,
            dateTo: filters.dateTo,

            currency: filters.currency,
            status: filters.status,
          };

          return this.paymentsService.getPayments(params).pipe(
            catchError(() => {
              this.itemsState.set([]);
              this.totalState.set(0);
              this.errorState.set('Не вдалося завантажити платежі');

              return of(null);
            }),
            finalize(() => {
              this.loadingState.set(false);
            })
          );
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((response) => {
        if (response === null) {
          return;
        }

        this.itemsState.set(response.items);
        this.totalState.set(response.total);
      });
  }

  // Load payments from the server
  // Завантажуємо платежі із сервера
  loadPayments(): void {
    this.loadPaymentsTrigger.next();
  }

  // Change current page
  // Змінюємо поточну сторінку
  setPage(page: number): void {
    this.pageState.set(page);
    this.loadPayments();
  }

  // Change page size
  // Змінюємо розмір сторінки
  setPageSize(size: number): void {
    this.pageSizeState.set(size);
    this.pageState.set(1);
    this.loadPayments();
  }

  // Change server-side sorting
  // Змінюємо серверне сортування
  setSort(sort: string): void {
    this.sortState.set(sort);
    this.pageState.set(1);
    this.loadPayments();
  }

  setFilters(filters: PaymentsFilters): void {
    this.filtersState.set(filters);
    this.pageState.set(1);
    this.loadPayments();
  }

  deletePayment(id: string): void {
    this.paymentsService.deletePayment(id).subscribe({
      next: () => {
        this.loadPayments();
      },
      error: () => {
        this.errorState.set('Не вдалося видалити платіж');
      },
    });
  }
}
