export type Currency = 'UAH' | 'EUR' | 'USD';
export type PaymentStatus = 'draft' | 'pending' | 'signed' | 'sent' | 'rejected';
export interface Payment {
  id: string;
  docNumber: string;
  date: string;
  payerName: string;
  payerIban: string;
  receiverName: string;
  receiverIban: string;
  amount: number;
  currency: Currency;
  status: PaymentStatus;
  comment: string | null;
}
