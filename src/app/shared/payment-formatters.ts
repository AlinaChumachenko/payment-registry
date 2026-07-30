import { Currency, PaymentStatus } from '../models/payment';

export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  draft: 'Чернетка',
  pending: 'Очікує підпису',
  signed: 'Підписаний',
  sent: 'Відправлений',
  rejected: 'Відхилений',
};

export function formatPaymentAmount(amount: number): string {
  return new Intl.NumberFormat('uk-UA', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}
