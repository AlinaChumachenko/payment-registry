import { DestroyRef, inject, Injectable, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs';

import { Payment } from '../models/payment';
import { PaymentsService } from '../services/payments.service';

@Injectable({
  providedIn: 'root',
})
export class PaymentsStore {
  private readonly paymentsService = inject(PaymentsService);
  private readonly destroyRef = inject(DestroyRef);

  // Internal writable state
  // Внутрішній стан, який може змінювати тільки store
  private readonly itemsState = signal<Payment[]>([]);
  private readonly totalState = signal(0);
  private readonly loadingState = signal(false);
  private readonly errorState = signal<string | null>(null);
  private readonly pageState = signal(1);
  private readonly pageSizeState = signal(25);
  private readonly sortState = signal('');

  // Public read-only state
  // Публічний стан лише для читання
  readonly items = this.itemsState.asReadonly();
  readonly total = this.totalState.asReadonly();
  readonly loading = this.loadingState.asReadonly();
  readonly error = this.errorState.asReadonly();
  readonly page = this.pageState.asReadonly();
  readonly pageSize = this.pageSizeState.asReadonly();
  readonly sort = this.sortState.asReadonly();

  // Load payments from the server
  // Завантажуємо платежі із сервера
  loadPayments(): void {
    this.loadingState.set(true);
    this.errorState.set(null);

    this.paymentsService
      .getPayments(this.pageState(), this.pageSizeState(), this.sortState())
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => {
          this.loadingState.set(false);
        })
      )
      .subscribe({
        next: (response) => {
          this.itemsState.set(response.items);
          this.totalState.set(response.total);
        },
        error: () => {
          this.itemsState.set([]);
          this.totalState.set(0);
          this.errorState.set('Не вдалося завантажити платежі');
        },
      });
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
}
