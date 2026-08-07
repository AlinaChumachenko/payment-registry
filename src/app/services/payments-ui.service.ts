import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class PaymentsUiService {
  readonly filtersOpen = signal(false);
  readonly registryOpen = signal(false);

  private readonly createPaymentRequestState = signal(0);
  private readonly registryRequestState = signal(0);

  readonly createPaymentRequest = this.createPaymentRequestState.asReadonly();
  readonly registryRequest = this.registryRequestState.asReadonly();

  toggleRegistry(): void {
    this.registryOpen.update((value) => !value);
  }

  requestCreatePayment(): void {
    this.createPaymentRequestState.update((value) => value + 1);
  }

  toggleFilters(): void {
    this.filtersOpen.update((value) => !value);
  }

  requestRegistry(): void {
    this.registryRequestState.update((value) => value + 1);
  }
}
