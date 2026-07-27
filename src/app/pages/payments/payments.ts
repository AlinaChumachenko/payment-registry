import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { AgGridAngular } from 'ag-grid-angular';
import { AllCommunityModule, ColDef, ModuleRegistry } from 'ag-grid-community';
import { Payment } from '../../models/payment';
import { PaymentsStore } from '../../stores/payments.store';

ModuleRegistry.registerModules([AllCommunityModule]);
@Component({
  selector: 'app-payments',
  standalone: true,
  imports: [AgGridAngular],
  templateUrl: './payments.html',
  styleUrl: './payments.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PaymentsPage {
  private readonly paymentsStore = inject(PaymentsStore);
  // Define grid columns
  // Описуємо колонки таблиці
  readonly columnDefs: ColDef<Payment>[] = [
    {
      field: 'docNumber',
      headerName: 'Document №',
    },
    {
      field: 'date',
      headerName: 'Date',
    },
    {
      field: 'payerName',
      headerName: 'Payer',
    },
    {
      field: 'payerIban',
      headerName: 'Payer IBAN',
    },
    {
      field: 'receiverName',
      headerName: 'Receiver',
    },
    {
      field: 'receiverIban',
      headerName: 'Receiver IBAN',
    },
    {
      field: 'amount',
      headerName: 'Amount',
    },
    {
      field: 'currency',
      headerName: 'Currency',
    },
    {
      field: 'status',
      headerName: 'Status',
    },
    {
      field: 'comment',
      headerName: 'Comment',
    },
  ];

  readonly rowData = this.paymentsStore.items;
  readonly total = this.paymentsStore.total;
  readonly loading = this.paymentsStore.loading;
  readonly error = this.paymentsStore.error;
  readonly page = this.paymentsStore.page;
  readonly pageSize = this.paymentsStore.pageSize;

  // Calculate the total number of pages
  // Обчислюємо загальну кількість сторінок
  readonly totalPages = computed(() => Math.ceil(this.total() / this.pageSize()));

  // Check whether the previous page is available
  // Перевіряємо, чи доступна попередня сторінка
  readonly canGoToPreviousPage = computed(() => this.page() > 1);

  // Check whether the next page is available
  // Перевіряємо, чи доступна наступна сторінка
  readonly canGoToNextPage = computed(() => this.page() < this.totalPages());

  constructor() {
    this.paymentsStore.loadPayments();
  }

  goToPreviousPage(): void {
    if (this.page() > 1) {
      this.paymentsStore.setPage(this.page() - 1);
    }
  }

  goToNextPage(): void {
    this.paymentsStore.setPage(this.page() + 1);
  }

  changePageSize(size: number): void {
    this.paymentsStore.setPageSize(size);
  }
}
