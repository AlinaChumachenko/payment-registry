import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AgGridAngular } from 'ag-grid-angular';
import {
  AllCommunityModule,
  ColDef,
  ModuleRegistry,
  SortChangedEvent,
  ICellRendererParams,
} from 'ag-grid-community';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { debounceTime, distinctUntilChanged, finalize } from 'rxjs';
import {
  CreatePayment as CreatePaymentPayload,
  Currency,
  Payment,
  PaymentStatus,
} from '../../models/payment';
import { PaymentsStore } from '../../stores/payments.store';
import { PAYMENT_STATUS_LABELS, formatPaymentAmount } from '../../shared/payment-formatters';
import { CreatePayment } from '../create-payment/create-payment';
import { PaymentsService } from '../../services/payments.service';
import { PaymentsUiService } from '../../services/payments-ui.service';

ModuleRegistry.registerModules([AllCommunityModule]);
@Component({
  selector: 'app-payments',
  standalone: true,
  imports: [AgGridAngular, ReactiveFormsModule, CreatePayment],
  templateUrl: './payments.html',
  styleUrl: './payments.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PaymentsPage {
  private readonly paymentsStore = inject(PaymentsStore);
  private readonly paymentsService = inject(PaymentsService);
  private readonly fb = inject(FormBuilder);
  private readonly destroyRef = inject(DestroyRef);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly paymentsUi = inject(PaymentsUiService);

  readonly isCreatePaymentOpen = signal(false);
  readonly isCreatingPayment = signal(false);
  readonly createPaymentError = signal<string | null>(null);
  readonly isFiltersOpen = this.paymentsUi.filtersOpen;
  readonly isRegistryOpen = this.paymentsUi.registryOpen;

  readonly editingPayment = signal<Payment | null>(null);
  readonly isEditingPayment = computed(() => this.editingPayment() !== null);

  readonly filtersForm = this.fb.group({
    docNumber: this.fb.nonNullable.control(''),
    payerName: this.fb.nonNullable.control(''),
    receiverName: this.fb.nonNullable.control(''),

    amountFrom: this.fb.control<number | null>(null),
    amountTo: this.fb.control<number | null>(null),

    dateFrom: this.fb.nonNullable.control(''),
    dateTo: this.fb.nonNullable.control(''),

    currency: this.fb.nonNullable.control<Currency | ''>(''),
    status: this.fb.nonNullable.control<PaymentStatus[]>([]),
  });

  readonly currencyOptions: Currency[] = ['UAH', 'USD', 'EUR'];

  readonly statusOptions: {
    value: PaymentStatus;
    label: string;
  }[] = [
    { value: 'draft', label: 'Чернетка' },
    { value: 'pending', label: 'Очікує підпису' },
    { value: 'signed', label: 'Підписаний' },
    { value: 'sent', label: 'Відправлений' },
    { value: 'rejected', label: 'Відхилений' },
  ];

  readonly statusLabels = PAYMENT_STATUS_LABELS;
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
      valueFormatter: (params) =>
        new Intl.DateTimeFormat('uk-UA', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        }).format(new Date(params.value)),
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
      valueFormatter: (params) => formatPaymentAmount(params.value),
      cellClassRules: {
        'text-red-600': (params) => params.value < 0,
      },
    },
    {
      field: 'currency',
      headerName: 'Currency',
    },
    {
      field: 'status',
      headerName: 'Статус',
      cellRenderer: (params: ICellRendererParams<Payment>) => {
        const status = params.value as PaymentStatus;

        const statusClasses: Record<PaymentStatus, string> = {
          draft: 'bg-slate-100 text-slate-700',
          pending: 'bg-amber-100 text-amber-800',
          signed: 'bg-blue-100 text-blue-800',
          sent: 'bg-green-100 text-green-800',
          rejected: 'bg-red-100 text-red-800',
        };

        const badge = document.createElement('span');

        badge.className = [
          'inline-flex',
          'items-center',
          'rounded-full',
          'px-2.5',
          'py-1',
          'text-xs',
          'font-semibold',
          'whitespace-nowrap',
          statusClasses[status],
        ].join(' ');

        badge.textContent = this.statusLabels[status];

        return badge;
      },
    },
    {
      field: 'comment',
      headerName: 'Comment',
    },
    {
      headerName: 'Дії',
      colId: 'actions',
      sortable: false,
      filter: false,
      pinned: 'right',
      width: 130,
      cellRenderer: (params: ICellRendererParams<Payment>) => {
        const wrapper = document.createElement('div');
        wrapper.className = 'flex h-full min-w-max items-center justify-center gap-1';
        const editButton = document.createElement('button');
        editButton.type = 'button';
        editButton.textContent = 'Редагувати';
        editButton.className =
          'flex h-8 items-center justify-center rounded border border-slate-300 bg-white px-3 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-100 shrink-0';

        editButton.addEventListener('click', (event) => {
          event.stopPropagation();

          if (params.data) {
            this.openEditPayment(params.data);
          }
        });

        const deleteButton = document.createElement('button');
        deleteButton.type = 'button';
        deleteButton.textContent = '🗑';

        deleteButton.className =
          'flex h-8 w-8 shrink-0 items-center justify-center rounded border border-red-300 bg-white text-red-500 transition-colors hover:bg-red-50 hover:text-red-700';

        deleteButton.addEventListener('click', (event) => {
          event.stopPropagation();

          if (params.data) {
            this.deletePayment(params.data);
          }
        });

        wrapper.append(editButton);
        wrapper.append(deleteButton);

        return wrapper;
      },
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

  private getNumberQueryParam(name: string): number | null {
    const value = this.route.snapshot.queryParamMap.get(name);

    return value === null ? null : Number(value);
  }

  // Check whether the previous page is available
  // Перевіряємо, чи доступна попередня сторінка
  readonly canGoToPreviousPage = computed(() => this.page() > 1);

  // Check whether the next page is available
  // Перевіряємо, чи доступна наступна сторінка
  readonly canGoToNextPage = computed(() => this.page() < this.totalPages());

  constructor() {
    this.filtersForm.patchValue({
      docNumber: this.route.snapshot.queryParamMap.get('docNumber') ?? '',
      payerName: this.route.snapshot.queryParamMap.get('payerName') ?? '',
      receiverName: this.route.snapshot.queryParamMap.get('receiverName') ?? '',
      amountFrom: this.getNumberQueryParam('amountFrom'),
      amountTo: this.getNumberQueryParam('amountTo'),
      dateFrom: this.route.snapshot.queryParamMap.get('dateFrom') ?? '',
      dateTo: this.route.snapshot.queryParamMap.get('dateTo') ?? '',
      currency: (this.route.snapshot.queryParamMap.get('currency') as Currency | null) ?? '',
      status: this.route.snapshot.queryParamMap.getAll('status') as PaymentStatus[],
    });

    this.paymentsStore.setFilters({
      docNumber: this.filtersForm.controls.docNumber.value,
      payerName: this.filtersForm.controls.payerName.value,
      receiverName: this.filtersForm.controls.receiverName.value,
      amountFrom: this.filtersForm.controls.amountFrom.value,
      amountTo: this.filtersForm.controls.amountTo.value,
      dateFrom: this.filtersForm.controls.dateFrom.value,
      dateTo: this.filtersForm.controls.dateTo.value,
      currency: this.filtersForm.controls.currency.value,
      status: this.filtersForm.controls.status.value,
    });

    this.filtersForm.valueChanges
      .pipe(
        debounceTime(300),
        distinctUntilChanged(
          (previous, current) => JSON.stringify(previous) === JSON.stringify(current)
        ),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((filters) => {
        this.paymentsStore.setFilters({
          docNumber: filters.docNumber ?? '',
          payerName: filters.payerName ?? '',
          receiverName: filters.receiverName ?? '',
          amountFrom: filters.amountFrom ?? null,
          amountTo: filters.amountTo ?? null,
          dateFrom: filters.dateFrom ?? '',
          dateTo: filters.dateTo ?? '',
          currency: filters.currency ?? '',
          status: filters.status ?? [],
        });
        this.router.navigate([], {
          relativeTo: this.route,
          queryParams: {
            page: this.page() > 1 ? this.page() : null,
            docNumber: filters.docNumber || null,
            payerName: filters.payerName || null,
            receiverName: filters.receiverName || null,
            amountFrom: filters.amountFrom ?? null,
            amountTo: filters.amountTo ?? null,
            dateFrom: filters.dateFrom || null,
            dateTo: filters.dateTo || null,
            currency: filters.currency || null,
            status: filters.status?.length ? filters.status : null,
          },
          queryParamsHandling: 'merge',
        });
      });

    effect(() => {
      const request = this.paymentsUi.createPaymentRequest();

      if (request === 0) {
        return;
      }

      this.openCreatePayment();
    });

    // effect(() => {
    //   const request = this.paymentsUi.registryRequest();

    //   if (request === 0) {
    //     return;
    //   }

    //   this.scrollToRegistry();
    // });
  }

  goToPreviousPage(): void {
    if (this.page() > 1) {
      this.paymentsStore.setPage(this.page() - 1);
    }
  }

  goToNextPage(): void {
    this.paymentsStore.setPage(this.page() + 1);
  }

  // Handle grid sorting changes
  // Обробляємо зміну сортування в таблиці
  onSortChanged(event: SortChangedEvent<Payment>): void {
    const sort = event.api
      .getColumnState()
      .filter((column) => column.sort !== null)
      .sort((a, b) => (a.sortIndex ?? 0) - (b.sortIndex ?? 0))
      .map((column) => `${column.colId}:${column.sort}`)
      .join(',');

    this.paymentsStore.setSort(sort);
  }
  // Change page size
  // Змінюємо розмір сторінки
  changePageSize(size: number): void {
    this.paymentsStore.setPageSize(size);
  }

  onRowClicked(payment: Payment | undefined): void {
    if (!payment) {
      return;
    }

    this.router.navigate(['/payments', payment.id]);
  }

  savePayment(payment: CreatePaymentPayload): void {
    if (this.isCreatingPayment()) {
      return;
    }

    this.isCreatingPayment.set(true);
    this.createPaymentError.set(null);

    const currentPayment = this.editingPayment();

    const request$ = currentPayment
      ? this.paymentsService.updatePayment(currentPayment.id, payment)
      : this.paymentsService.createPayment(payment);

    request$
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => {
          this.isCreatingPayment.set(false);
        })
      )
      .subscribe({
        next: () => {
          this.closeCreatePayment();
          this.paymentsStore.loadPayments();
        },
        error: () => {
          this.createPaymentError.set(
            currentPayment
              ? 'Не вдалося оновити платіж. Спробуйте ще раз.'
              : 'Не вдалося створити платіж. Спробуйте ще раз.'
          );
        },
      });
  }

  openCreatePayment(): void {
    this.editingPayment.set(null);
    this.createPaymentError.set(null);
    this.isCreatePaymentOpen.set(true);
  }

  openEditPayment(payment: Payment): void {
    this.editingPayment.set(payment);
    this.createPaymentError.set(null);
    this.isCreatePaymentOpen.set(true);
  }

  deletePayment(payment: Payment): void {
    const confirmed = window.confirm(`Видалити платіж ${payment.docNumber}?`);

    if (!confirmed) {
      return;
    }

    this.paymentsService
      .deletePayment(payment.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.paymentsStore.loadPayments();
        },
        error: () => {
          alert('Не вдалося видалити платіж');
        },
      });
  }

  closeCreatePayment(): void {
    this.isCreatePaymentOpen.set(false);
    this.editingPayment.set(null);
  }
  retryLoad(): void {
    this.paymentsStore.loadPayments();
  }

  toggleFilters(): void {
    this.isFiltersOpen.update((value) => !value);
  }

  // scrollToRegistry(): void {
  //   document.getElementById('payments-registry')?.scrollIntoView({
  //     behavior: 'smooth',
  //     block: 'start',
  //   });
  // }
  resetFilters(): void {
    this.filtersForm.reset({
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
  }
}
