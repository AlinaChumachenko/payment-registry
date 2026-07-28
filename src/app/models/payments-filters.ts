import { Currency, PaymentStatus } from './payment';

export interface PaymentsFilters {
  docNumber: string;
  payerName: string;
  receiverName: string;

  amountFrom: number | null;
  amountTo: number | null;

  dateFrom: string;
  dateTo: string;

  currency: Currency | '';
  status: PaymentStatus[];
}
