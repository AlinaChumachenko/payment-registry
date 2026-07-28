import { PaymentStatus } from './payment';
export interface PaymentsQueryParams {
  page: number;
  size: number;
  sort: string;

  docNumber: string;
  payerName: string;
  receiverName: string;

  amountFrom: number | null;
  amountTo: number | null;

  dateFrom: string;
  dateTo: string;

  currency: string | '';
  status: PaymentStatus[];
}
