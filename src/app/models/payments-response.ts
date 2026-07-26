import { Payment } from './payment';

export interface PaymentsResponse {
  payments: Payment[];
  total: number;
}
