import { Payment } from './payment';

export interface PaymentsResponse {
  items: Payment[];
  total: number;
}
